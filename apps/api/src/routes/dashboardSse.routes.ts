import { Router, Request, Response } from 'express';
import { sseAuthMiddleware } from '../middleware/sseAuth.middleware';
import { addDashboardClient } from '../services/dashboardSse.service';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', sseAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    // @ts-ignore
    const user = req.user;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId is required' });
    }

    // Verify user is a member of this workspace
    const isMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id }
    });

    if (!isMember && user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied to this workspace' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    addDashboardClient(workspaceId, res);

  } catch (error) {
    res.status(500).end();
  }
});

export default router;
