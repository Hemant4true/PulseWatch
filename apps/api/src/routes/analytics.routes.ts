import { Router } from 'express';
import { getOverview, exportCSV, exportPDF } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { pdfExportLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/overview', getOverview);
router.get('/export/csv', exportCSV);
router.get('/export/pdf', pdfExportLimiter, exportPDF);

export default router;
