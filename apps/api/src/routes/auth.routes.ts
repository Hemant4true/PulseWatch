import { Router } from 'express';
import { register, login, logout, refresh, me } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, me);

// For Phase 3, we'll omit full forgot/reset implementations to save space but map them if needed
router.post('/forgot-password', (req, res) => res.json({ success: true, message: "Stub: Forgot Password" }));
router.post('/reset-password', (req, res) => res.json({ success: true, message: "Stub: Reset Password" }));

export default router;
