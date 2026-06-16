import { Router } from 'express';
import { getMembers, inviteMember, revokeInvite, updateRole, removeMember, acceptInvite } from '../controllers/team.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { teamInviteLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/members', getMembers);
router.post('/invites', teamInviteLimiter, requireRole(['OWNER', 'ADMIN']), inviteMember);
router.post('/invites/accept', acceptInvite); // Publicly accessible to any authenticated user
router.delete('/invites/:id', requireRole(['OWNER', 'ADMIN']), revokeInvite);
router.patch('/members/:id/role', requireRole(['OWNER', 'ADMIN']), updateRole);
router.delete('/members/:id', requireRole(['OWNER', 'ADMIN']), removeMember);

export default router;
