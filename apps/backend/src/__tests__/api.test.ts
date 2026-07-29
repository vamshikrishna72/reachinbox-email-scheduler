import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/authRoutes.js';
import emailRoutes from '../routes/emailRoutes.js';
import statsRoutes from '../routes/statsRoutes.js';
import { errorHandler } from '../middlewares/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/stats', statsRoutes);
app.use(errorHandler);

describe('Auth & Email APIs Integration Tests', () => {
  let userToken: string;

  it('POST /api/auth/register - Should register demo test user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Evaluator',
      email: `test_${Date.now()}@reachinbox.ai`,
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    userToken = res.body.data.token;
  });

  it('GET /api/auth/me - Should fetch user profile with valid JWT', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Evaluator');
  });

  it('POST /api/emails/schedule - Should validate and enqueue email sequence', async () => {
    const res = await request(app)
      .post('/api/emails/schedule')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipients: 'user1@test.com, user2@test.com',
        subject: 'Vitest Automated Integration Test',
        body: '<p>Testing BullMQ integration</p>',
        userDelaySeconds: 2,
        hourlyRateLimit: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalEmails).toBe(2);
  });

  it('GET /api/stats/dashboard - Should return dashboard metrics', async () => {
    const res = await request(app)
      .get('/api/stats/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalEmails).toBeGreaterThanOrEqual(2);
  });
});
