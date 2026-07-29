import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { initQueueSystem } from './queues/emailQueue.js';

import authRoutes from './routes/authRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.nodeEnv });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/stats', statsRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server and Queue Worker
app.listen(config.port, async () => {
  console.log(`🚀 [Backend Server] Listening on http://localhost:${config.port}`);
  await initQueueSystem();
});
