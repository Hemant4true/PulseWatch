import { Router } from 'express';
import { getIncidents, getIncident, updateIncident, createIncident } from '../controllers/incidents.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getIncidents);
router.post('/', requireRole(['OWNER', 'ADMIN']), createIncident);
router.get('/:id', getIncident);
router.patch('/:id', requireRole(['OWNER', 'ADMIN']), updateIncident);

export default router;
