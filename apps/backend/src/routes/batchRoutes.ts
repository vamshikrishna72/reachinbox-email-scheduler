import { Router } from 'express';
import { getBatches, pauseBatch, resumeBatch } from '../controllers/batchController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getBatches);
router.post('/:id/pause', pauseBatch);
router.post('/:id/resume', resumeBatch);

export default router;
