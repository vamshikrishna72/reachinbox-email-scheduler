import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, config } from '../config/index.js';
import { registerSchema, loginSchema } from '../validators/index.js';
import { AuthRequest } from '../middlewares/auth.js';

export async function register(req: AuthRequest, res: Response) {
  const data = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    res.status(400).json({ success: false, error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
  });

  const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
}

export async function login(req: AuthRequest, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid email or password' });
    return;
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);

  if (!isMatch) {
    res.status(401).json({ success: false, error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
}

export async function getMe(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  res.json({
    success: true,
    data: user,
  });
}
