import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboardStats);

export default router;
