import { NextResponse } from 'next/server';
import { prisma, verifyToken } from '../../../../lib/serverHelper';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');

  const whereClause: any = {
    userId: decoded.userId,
    status: { in: ['SCHEDULED', 'QUEUED', 'PROCESSING'] },
  };

  if (search) {
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

  return NextResponse.json({ success: true, data: emails });
}
