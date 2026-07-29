import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../config/index.js';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const [totalEmails, scheduledCount, sentCount, failedCount, activeBatchesCount] =
    await Promise.all([
      prisma.scheduledEmail.count({ where: { userId } }),
      prisma.scheduledEmail.count({
        where: { userId, status: { in: ['SCHEDULED', 'QUEUED', 'PROCESSING'] } },
      }),
      prisma.scheduledEmail.count({ where: { userId, status: 'SENT' } }),
      prisma.scheduledEmail.count({ where: { userId, status: 'FAILED' } }),
      prisma.emailBatch.count({ where: { userId, status: 'PROCESSING' } }),
    ]);

  // Hourly sending velocity check (emails sent in the last 1 hour)
  const oneHourAgo = new Date(Date.now() - 3600 * 1000);
  const sentLastHour = await prisma.scheduledEmail.count({
    where: {
      userId,
      status: 'SENT',
      sentAt: { gte: oneHourAgo },
    },
  });

  res.json({
    success: true,
    data: {
      totalEmails,
      scheduledCount,
      sentCount,
      failedCount,
      activeBatchesCount,
      sentLastHour,
      hourlyQuotaCap: 50, // Display default rate cap
    },
  });
}
