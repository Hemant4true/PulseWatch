import { Router } from 'express';
import { getStats, getUsers, getWorkspaces, toggleSuspend } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/admin.middleware';

const router = Router();

// All admin routes require authentication and SUPERADMIN role
router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/workspaces', getWorkspaces);
router.patch('/users/:id/suspend', toggleSuspend);

export default router;
