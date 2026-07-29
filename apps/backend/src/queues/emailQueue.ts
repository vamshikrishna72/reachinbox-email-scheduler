import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config, prisma } from '../config/index.js';
import { etherealService } from '../services/ethereal.js';

export interface EmailJobData {
  emailId: string;
  recipient: string;
  subject: string;
  body: string;
  batchId?: string;
  userId: string;
}

let redisConnection: Redis | null = null;
let emailQueue: Queue<EmailJobData> | null = null;
let isRedisAvailable = false;

// Attempt Redis connection
try {
  redisConnection = new Redis({
    host: config.redisHost,
    port: config.redisPort,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      if (times > 2) {
        return null; // Stop retrying Redis after 2 attempts
      }
      return 1000;
    },
  });

  redisConnection.on('connect', () => {
    console.log('✅ [BullMQ] Connected to Redis successfully');
    isRedisAvailable = true;
  });

  redisConnection.on('error', (err) => {
    if (isRedisAvailable) {
      console.warn('⚠️ [BullMQ] Redis connection error:', err.message);
    }
    isRedisAvailable = false;
  });
} catch (e) {
  console.warn('⚠️ [BullMQ] Redis unavailable, using Memory Queue Fallback.');
  isRedisAvailable = false;
}

// Memory Queue Fallback Timer Map
const memoryTimers = new Map<string, NodeJS.Timeout>();

export async function initQueueSystem() {
  if (isRedisAvailable && redisConnection) {
    try {
      emailQueue = new Queue<EmailJobData>('email-dispatch-queue', {
        connection: redisConnection,
      });

      const worker = new Worker<EmailJobData>(
        'email-dispatch-queue',
        async (job: Job<EmailJobData>) => {
          await processEmailJob(job.data);
        },
        {
          connection: redisConnection,
          concurrency: 5,
        }
      );

      worker.on('completed', (job) => {
        console.log(`[BullMQ Worker] Job ${job.id} completed for email ${job.data.emailId}`);
      });

      worker.on('failed', (job, err) => {
        console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
      });

      console.log('🚀 [BullMQ Engine] Redis Queue Worker active.');
    } catch (err) {
      console.warn('⚠️ [BullMQ] Failed to start Redis Worker. Falling back to Memory Queue.');
      isRedisAvailable = false;
    }
  } else {
    console.log('⚡ [Queue Engine] Memory Queue Fallback initialized.');
  }

  // Auto-recover pending jobs on boot
  await recoverPendingJobsOnBoot();
}

export async function enqueueEmailJob(data: EmailJobData, delayMs: number = 0) {
  // Update DB status to QUEUED
  await prisma.scheduledEmail.update({
    where: { id: data.emailId },
    data: { status: 'QUEUED' },
  });

  if (isRedisAvailable && emailQueue) {
    await emailQueue.add(`email-${data.emailId}`, data, {
      delay: Math.max(0, delayMs),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    console.log(`[Queue] Enqueued job ${data.emailId} in Redis with delay ${delayMs}ms`);
  } else {
    // Memory Queue dispatch
    const timer = setTimeout(async () => {
      memoryTimers.delete(data.emailId);
      await processEmailJob(data);
    }, Math.max(0, delayMs));

    memoryTimers.set(data.emailId, timer);
    console.log(`[Memory Queue] Scheduled job ${data.emailId} in memory with delay ${delayMs}ms`);
  }
}

export async function cancelEmailJob(emailId: string) {
  if (memoryTimers.has(emailId)) {
    clearTimeout(memoryTimers.get(emailId)!);
    memoryTimers.delete(emailId);
  }

  await prisma.scheduledEmail.update({
    where: { id: emailId },
    data: { status: 'CANCELLED' },
  });
}

async function processEmailJob(data: EmailJobData) {
  console.log(`[Dispatch Worker] Processing email ${data.emailId} to ${data.recipient}...`);

  // Check if job was cancelled in DB
  const currentRecord = await prisma.scheduledEmail.findUnique({
    where: { id: data.emailId },
  });

  if (!currentRecord || currentRecord.status === 'CANCELLED') {
    console.log(`[Dispatch Worker] Job ${data.emailId} was cancelled. Skipping.`);
    return;
  }

  await prisma.scheduledEmail.update({
    where: { id: data.emailId },
    data: {
      status: 'PROCESSING',
      attempts: { increment: 1 },
    },
  });

  try {
    const result = await etherealService.sendEmail({
      to: data.recipient,
      subject: data.subject,
      body: data.body,
    });

    // Update email record to SENT
    await prisma.scheduledEmail.update({
      where: { id: data.emailId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        etherealUrl: result.etherealUrl || null,
      },
    });

    // Update batch counter if part of a batch
    if (data.batchId) {
      await prisma.emailBatch.update({
        where: { id: data.batchId },
        data: {
          sentCount: { increment: 1 },
        },
      });

      await checkAndUpdateBatchCompletionStatus(data.batchId);
    }

    console.log(`✅ [Dispatch Worker] Email ${data.emailId} sent successfully! Ethereal URL: ${result.etherealUrl}`);
  } catch (error: any) {
    console.error(`❌ [Dispatch Worker] Error sending email ${data.emailId}:`, error.message);

    await prisma.scheduledEmail.update({
      where: { id: data.emailId },
      data: {
        status: 'FAILED',
        failureReason: error.message || 'SMTP Transmission Error',
      },
    });

    if (data.batchId) {
      await prisma.emailBatch.update({
        where: { id: data.batchId },
        data: {
          failedCount: { increment: 1 },
        },
      });

      await checkAndUpdateBatchCompletionStatus(data.batchId);
    }
  }
}

async function checkAndUpdateBatchCompletionStatus(batchId: string) {
  const batch = await prisma.emailBatch.findUnique({
    where: { id: batchId },
    include: { emails: true },
  });

  if (batch) {
    const completedCount = batch.sentCount + batch.failedCount;
    if (completedCount >= batch.totalEmails) {
      await prisma.emailBatch.update({
        where: { id: batchId },
        data: { status: 'COMPLETED' },
      });
      console.log(`🎉 [Batch Manager] Batch ${batchId} marked as COMPLETED.`);
    }
  }
}

async function recoverPendingJobsOnBoot() {
  console.log('🔄 [Queue Engine] Recovering un-dispatched jobs from database...');

  const pendingEmails = await prisma.scheduledEmail.findMany({
    where: {
      status: { in: ['SCHEDULED', 'QUEUED', 'PROCESSING'] },
    },
  });

  const now = Date.now();
  for (const email of pendingEmails) {
    const scheduledTime = new Date(email.scheduledAt).getTime();
    const delay = Math.max(0, scheduledTime - now);

    console.log(`[Boot Recovery] Re-enqueueing job ${email.id} (Scheduled at ${email.scheduledAt})`);
    await enqueueEmailJob(
      {
        emailId: email.id,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        batchId: email.batchId || undefined,
        userId: email.userId,
      },
      delay
    );
  }
}
