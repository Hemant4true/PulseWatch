import { Router } from 'express';
import { getPreferences, updatePreferences, testAlert } from '../controllers/alerts.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { testAlertLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/test', testAlertLimiter, testAlert);

export default router;
