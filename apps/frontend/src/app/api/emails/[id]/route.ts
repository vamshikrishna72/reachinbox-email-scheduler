import { NextResponse } from 'next/server';
import { prisma, verifyToken } from '../../../../lib/serverHelper';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  const { id } = await params;

  const email = await prisma.scheduledEmail.findFirst({
    where: { id, userId: decoded.userId },
  });

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
  }

  await prisma.scheduledEmail.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: 'Email deleted' });
}
