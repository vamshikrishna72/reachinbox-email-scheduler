import { NextResponse } from 'next/server';
import { prisma, verifyToken, sendEtherealEmail } from '../../../../lib/serverHelper';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  try {
    const input = await req.json();

    let recipientList: string[] = [];
    if (Array.isArray(input.recipients)) {
      recipientList = input.recipients;
    } else if (typeof input.recipients === 'string') {
      recipientList = input.recipients
        .split(',')
        .map((r: string) => r.trim())
        .filter((r: string) => r.length > 0);
    }

    if (recipientList.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one recipient is required' }, { status: 400 });
    }

    const baseScheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date();
    const baseTimestamp = baseScheduledAt.getTime();
    const userDelayMs = (input.userDelaySeconds || 2) * 1000;
    const now = Date.now();

    const batch = await prisma.emailBatch.create({
      data: {
        userId: decoded.userId,
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
      const isImmediate = targetTimestamp <= now + 5000;

      let etherealUrl = null;
      let status = 'SCHEDULED';
      let sentAt = null;

      if (isImmediate) {
        try {
          const etherealRes = await sendEtherealEmail({
            to: recipient,
            subject: input.subject,
            body: input.body,
          });
          etherealUrl = etherealRes.etherealUrl;
          status = 'SENT';
          sentAt = new Date();
        } catch (e) {
          status = 'FAILED';
        }
      }

      const emailRecord = await prisma.scheduledEmail.create({
        data: {
          userId: decoded.userId,
          batchId: batch.id,
          recipient,
          subject: input.subject,
          body: input.body,
          scheduledAt: targetScheduledAt,
          sentAt,
          status,
          etherealUrl,
        },
      });

      createdEmails.push(emailRecord);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          batchId: batch.id,
          totalEmails: createdEmails.length,
          scheduledEmails: createdEmails,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Scheduling failed' }, { status: 500 });
  }
}
