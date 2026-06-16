import { Router } from 'express';
import { getStatusPageConfig, updateStatusPageConfig } from '../controllers/statusPage.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getStatusPageConfig);
router.put('/', requireRole(['OWNER', 'ADMIN']), updateStatusPageConfig);

export default router;
