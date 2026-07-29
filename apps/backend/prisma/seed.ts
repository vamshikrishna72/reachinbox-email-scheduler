import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing tables
  await prisma.scheduledEmail.deleteMany();
  await prisma.emailBatch.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.create({
    data: {
      name: 'ReachInbox Evaluator',
      email: 'demo@reachinbox.ai',
      passwordHash,
    },
  });

  console.log(`👤 Created Demo User: ${demoUser.email} / password123`);

  // Create sample Batch
  const sampleBatch = await prisma.emailBatch.create({
    data: {
      userId: demoUser.id,
      name: 'Q3 Enterprise Product Demo Sequence',
      userDelaySeconds: 3,
      hourlyRateLimit: 50,
      totalEmails: 4,
      sentCount: 2,
      failedCount: 0,
      status: 'PROCESSING',
    },
  });

  const now = Date.now();

  // Past Sent Email 1
  await prisma.scheduledEmail.create({
    data: {
      userId: demoUser.id,
      batchId: sampleBatch.id,
      recipient: 'alex.smith@stripe.com',
      subject: 'Streamline your email deliverability with ReachInbox AI',
      body: '<p>Hi Alex,</p><p>Notice how high deliverability rate drives conversions? Let us show you our new BullMQ queue engine.</p>',
      scheduledAt: new Date(now - 300000),
      sentAt: new Date(now - 290000),
      status: 'SENT',
      etherealUrl: 'https://ethereal.email/message/Y6Z8...demo1',
    },
  });

  // Past Sent Email 2
  await prisma.scheduledEmail.create({
    data: {
      userId: demoUser.id,
      batchId: sampleBatch.id,
      recipient: 'sarah.j@datadog.com',
      subject: 'Quick question about Datadog outreach infrastructure',
      body: '<p>Hey Sarah,</p><p>Would love to give you a quick preview of our rate-limited scheduling features.</p>',
      scheduledAt: new Date(now - 120000),
      sentAt: new Date(now - 110000),
      status: 'SENT',
      etherealUrl: 'https://ethereal.email/message/X9P2...demo2',
    },
  });

  // Future Scheduled Email 1
  await prisma.scheduledEmail.create({
    data: {
      userId: demoUser.id,
      batchId: sampleBatch.id,
      recipient: 'engineering-lead@linear.app',
      subject: 'Linear-style UI meets high-throughput cold outreach',
      body: '<p>Hello Team,</p><p>Check out our real-time queue status monitor built with Next.js 15 and Framer Motion.</p>',
      scheduledAt: new Date(now + 600000),
      status: 'SCHEDULED',
    },
  });

  // Future Scheduled Email 2
  await prisma.scheduledEmail.create({
    data: {
      userId: demoUser.id,
      batchId: sampleBatch.id,
      recipient: 'cto@vercel.com',
      subject: 'Next.js 15 App Router & Distributed Queue Architecture',
      body: '<p>Hi Guillermo,</p><p>We built this assignment to showcase production-grade Next.js 15 architecture.</p>',
      scheduledAt: new Date(now + 1200000),
      status: 'SCHEDULED',
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
