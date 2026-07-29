if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:/tmp/dev.db';
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'reachinbox_super_secret_jwt_key_2026_production';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

let isSeeded = false;

async function ensureTablesExist() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS EmailBatch (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        userDelaySeconds INTEGER DEFAULT 2,
        hourlyRateLimit INTEGER DEFAULT 50,
        totalEmails INTEGER DEFAULT 0,
        sentCount INTEGER DEFAULT 0,
        failedCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'SCHEDULED',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ScheduledEmail (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        batchId TEXT,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        scheduledAt DATETIME NOT NULL,
        sentAt DATETIME,
        status TEXT DEFAULT 'SCHEDULED',
        etherealUrl TEXT,
        failureReason TEXT,
        attempts INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error('Table init warning:', e);
  }
}

// Auto-seed demo account on cold boot
export async function ensureDemoUserSeeded() {
  if (isSeeded) return;
  try {
    await ensureTablesExist();

    const existing = await prisma.user.findUnique({
      where: { email: 'demo@reachinbox.ai' },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          name: 'ReachInbox Evaluator',
          email: 'demo@reachinbox.ai',
          passwordHash,
        },
      });

      const batch = await prisma.emailBatch.create({
        data: {
          userId: user.id,
          name: 'Q3 Enterprise Product Demo Sequence',
          userDelaySeconds: 3,
          hourlyRateLimit: 50,
          totalEmails: 2,
          sentCount: 1,
          failedCount: 0,
          status: 'PROCESSING',
        },
      });

      const now = Date.now();
      await prisma.scheduledEmail.create({
        data: {
          userId: user.id,
          batchId: batch.id,
          recipient: 'alex.smith@stripe.com',
          subject: 'Streamline your email deliverability with ReachInbox AI',
          body: '<p>Hi Alex,</p><p>Notice how high deliverability rate drives conversions?</p>',
          scheduledAt: new Date(now - 300000),
          sentAt: new Date(now - 290000),
          status: 'SENT',
          etherealUrl: 'https://ethereal.email/message/Y6Z8...demo1',
        },
      });

      await prisma.scheduledEmail.create({
        data: {
          userId: user.id,
          batchId: batch.id,
          recipient: 'engineering-lead@linear.app',
          subject: 'Linear-style UI meets high-throughput cold outreach',
          body: '<p>Hello Team,</p><p>Check out our real-time queue status monitor built with Next.js 15.</p>',
          scheduledAt: new Date(now + 600000),
          status: 'SCHEDULED',
        },
      });
      console.log('✅ Demo user seeded automatically in Prisma!');
    }
    isSeeded = true;
  } catch (err) {
    console.error('Error seeding demo user:', err);
  }
}

export function signToken(payload: { userId: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (e) {
    return null;
  }
}

export async function sendEtherealEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"ReachInbox Outreach Engine" <noreply@reachinbox.ai>',
    to,
    subject,
    html: body,
    text: body.replace(/<[^>]*>?/gm, ''),
  });

  const etherealUrl = nodemailer.getTestMessageUrl(info);
  return {
    messageId: info.messageId,
    etherealUrl: etherealUrl || null,
  };
}
