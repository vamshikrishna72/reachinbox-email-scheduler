import { Router } from 'express';
import {
  scheduleEmails,
  getScheduledEmails,
  getSentEmails,
  cancelEmail,
  resendEmail,
  deleteEmail,
} from '../controllers/emailController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/schedule', scheduleEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.post('/:id/cancel', cancelEmail);
router.post('/:id/resend', resendEmail);
router.delete('/:id', deleteEmail);

export default router;
