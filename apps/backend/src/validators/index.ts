import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const scheduleEmailSchema = z.object({
  recipients: z.union([
    z.string().min(1, 'Recipient email is required'),
    z.array(z.string().email('Invalid recipient email format')).min(1, 'At least one recipient is required'),
  ]),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
  scheduledAt: z.string().optional(), // ISO String, defaults to immediate if omitted
  userDelaySeconds: z.number().int().min(0).optional().default(2),
  hourlyRateLimit: z.number().int().min(1).optional().default(50),
});
