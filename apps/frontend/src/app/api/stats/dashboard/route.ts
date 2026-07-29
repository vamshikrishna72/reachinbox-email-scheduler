import { NextResponse } from 'next/server';
import { prisma, verifyToken, ensureDemoUserSeeded } from '../../../../lib/serverHelper';

export async function GET(req: Request) {
  await ensureDemoUserSeeded();

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  const userId = decoded.userId;

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

  const oneHourAgo = new Date(Date.now() - 3600 * 1000);
  const sentLastHour = await prisma.scheduledEmail.count({
    where: {
      userId,
      status: 'SENT',
      sentAt: { gte: oneHourAgo },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      totalEmails,
      scheduledCount,
      sentCount,
      failedCount,
      activeBatchesCount,
      sentLastHour,
      hourlyQuotaCap: 50,
    },
  });
}
