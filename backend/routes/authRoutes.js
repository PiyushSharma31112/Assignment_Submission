import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { currentUser, login, logout, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, currentUser);
router.post('/logout', logout);

export default router;
