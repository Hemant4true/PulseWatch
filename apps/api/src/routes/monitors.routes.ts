import { Router } from 'express';
import { getMonitors, getMonitor, createMonitor, updateMonitor, deleteMonitor, bulkAction, testConnection } from '../controllers/monitors.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { createMonitorLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getMonitors);
router.post('/', createMonitorLimiter, requireRole(['OWNER', 'ADMIN']), createMonitor);
router.post('/bulk', requireRole(['OWNER', 'ADMIN']), bulkAction);
router.post('/test', requireRole(['OWNER', 'ADMIN']), testConnection);
router.get('/:id', getMonitor);
router.patch('/:id', requireRole(['OWNER', 'ADMIN']), updateMonitor);
router.delete('/:id', requireRole(['OWNER', 'ADMIN']), deleteMonitor);

export default router;
