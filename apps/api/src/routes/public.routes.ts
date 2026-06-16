import { Router } from 'express';
import { getPublicStatus, sseStatus } from '../controllers/public.controller';

const router = Router();

router.get('/:slug', getPublicStatus);
router.get('/sse/status/:slug', sseStatus);

export default router;
