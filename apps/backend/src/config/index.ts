import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET || 'reachinbox_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const prisma = new PrismaClient();
