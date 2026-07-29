import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../config/index.js';
import { scheduleEmailSchema } from '../validators/index.js';
import { enqueueEmailJob, cancelEmailJob } from '../queues/emailQueue.js';

export async function scheduleEmails(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const input = scheduleEmailSchema.parse(req.body);

  // Parse recipients list
  let recipientList: string[] = [];
  if (Array.isArray(input.recipients)) {
    recipientList = input.recipients;
  } else if (typeof input.recipients === 'string') {
    recipientList = input.recipients
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
  }

  if (recipientList.length === 0) {
    res.status(400).json({ success: false, error: 'At least one valid recipient is required' });
    return;
  }

  const baseScheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date();
  const baseTimestamp = baseScheduledAt.getTime();
  const userDelayMs = (input.userDelaySeconds || 2) * 1000;
  const now = Date.now();

  // Create Email Batch record if multiple recipients or delay specified
  const batch = await prisma.emailBatch.create({
    data: {
      userId,
      name: `${input.subject} (${recipientList.length} recipients)`,
      userDelaySeconds: input.userDelaySeconds || 2,
      hourlyRateLimit: input.hourlyRateLimit || 50,
      totalEmails: recipientList.length,
      status: 'PROCESSING',
    },
  });

  const createdEmails = [];

  for (let i = 0; i < recipientList.length; i++) {
    const recipient = recipientList[i];
    const targetTimestamp = baseTimestamp + i * userDelayMs;
    const targetScheduledAt = new Date(targetTimestamp);
    const delayFromNow = Math.max(0, targetTimestamp - now);

    const emailRecord = await prisma.scheduledEmail.create({
      data: {
        userId,
        batchId: batch.id,
        recipient,
        subject: input.subject,
        body: input.body,
        scheduledAt: targetScheduledAt,
        status: 'SCHEDULED',
      },
    });

    await enqueueEmailJob(
      {
        emailId: emailRecord.id,
        recipient: emailRecord.recipient,
        subject: emailRecord.subject,
        body: emailRecord.body,
        batchId: batch.id,
        userId,
      },
      delayFromNow
    );

    createdEmails.push(emailRecord);
  }

  res.status(201).json({
    success: true,
    data: {
      batchId: batch.id,
      totalEmails: createdEmails.length,
      scheduledEmails: createdEmails,
    },
  });
}

export async function getScheduledEmails(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { search } = req.query;

  const whereClause: any = {
    userId,
    status: { in: ['SCHEDULED', 'QUEUED', 'PROCESSING'] },
  };

  if (search && typeof search === 'string') {
    whereClause.OR = [
      { recipient: { contains: search } },
      { subject: { contains: search } },
    ];
  }

  const emails = await prisma.scheduledEmail.findMany({
    where: whereClause,
    orderBy: { scheduledAt: 'asc' },
    include: { batch: true },
  });

  res.json({
    success: true,
    data: emails,
  });
}

export async function getSentEmails(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { search, status } = req.query;

  const whereClause: any = {
    userId,
    status: status ? (status as string) : { in: ['SENT', 'FAILED', 'CANCELLED'] },
  };

  if (search && typeof search === 'string') {
    whereClause.OR = [
      { recipient: { contains: search } },
      { subject: { contains: search } },
    ];
  }

  const emails = await prisma.scheduledEmail.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    include: { batch: true },
  });

  res.json({
    success: true,
    data: emails,
  });
}

export async function cancelEmail(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const email = await prisma.scheduledEmail.findFirst({
    where: { id, userId },
  });

  if (!email) {
    res.status(404).json({ success: false, error: 'Email not found' });
    return;
  }

  if (['SENT', 'FAILED', 'CANCELLED'].includes(email.status)) {
    res.status(400).json({ success: false, error: `Cannot cancel email with status ${email.status}` });
    return;
  }

  await cancelEmailJob(id);

  res.json({
    success: true,
    message: 'Email dispatch cancelled successfully',
  });
}

export async function resendEmail(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const email = await prisma.scheduledEmail.findFirst({
    where: { id, userId },
  });

  if (!email) {
    res.status(404).json({ success: false, error: 'Email not found' });
    return;
  }

  await enqueueEmailJob(
    {
      emailId: email.id,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      batchId: email.batchId || undefined,
      userId,
    },
    0
  );

  res.json({
    success: true,
    message: 'Email re-queued for immediate dispatch',
  });
}

export async function deleteEmail(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const email = await prisma.scheduledEmail.findFirst({
    where: { id, userId },
  });

  if (!email) {
    res.status(404).json({ success: false, error: 'Email not found' });
    return;
  }

  if (['SCHEDULED', 'QUEUED', 'PROCESSING'].includes(email.status)) {
    await cancelEmailJob(id);
  }

  await prisma.scheduledEmail.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Email deleted successfully',
  });
}
