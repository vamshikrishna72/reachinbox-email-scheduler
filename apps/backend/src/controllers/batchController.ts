import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../config/index.js';

export async function getBatches(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const batches = await prisma.emailBatch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { emails: true },
      },
    },
  });

  res.json({
    success: true,
    data: batches,
  });
}

export async function pauseBatch(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const batch = await prisma.emailBatch.findFirst({
    where: { id, userId },
  });

  if (!batch) {
    res.status(404).json({ success: false, error: 'Batch not found' });
    return;
  }

  await prisma.emailBatch.update({
    where: { id },
    data: { status: 'PAUSED' },
  });

  res.json({
    success: true,
    message: 'Batch processing paused',
  });
}

export async function resumeBatch(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const batch = await prisma.emailBatch.findFirst({
    where: { id, userId },
  });

  if (!batch) {
    res.status(404).json({ success: false, error: 'Batch not found' });
    return;
  }

  await prisma.emailBatch.update({
    where: { id },
    data: { status: 'PROCESSING' },
  });

  res.json({
    success: true,
    message: 'Batch processing resumed',
  });
}
