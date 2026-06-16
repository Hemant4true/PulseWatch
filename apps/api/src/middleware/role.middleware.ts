import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { WorkspaceRole } from '@prisma/client';

export const requireRole = (allowedRoles: WorkspaceRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore
      const userId = req.user.id;

      // Extract workspaceId or monitorId or status page id to determine workspace
      let workspaceId = req.body.workspaceId || req.query.workspaceId;

      if (!workspaceId) {
        // Fallback: lookup by user's first workspace for simple routes, 
        // or check if there's a monitorId in body/params
        const monitorId = req.body.monitorId || req.params.id; // Many routes use /:id as monitorId
        
        // Wait, if it's the monitors controller, req.params.id is monitorId.
        // If it's the statusPage controller, there's no id usually.
        // To make it robust, let's just fetch the user's workspace since users in this app only have one primary workspace currently based on our other controllers (getWorkspaceId helper).
        const member = await prisma.workspaceMember.findFirst({
          where: { userId }
        });
        
        if (member) {
          workspaceId = member.workspaceId;
        }
      }

      if (!workspaceId) {
        return res.status(403).json({ success: false, message: 'Forbidden: No workspace context' });
      }

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });

      if (!member || !allowedRoles.includes(member.role as WorkspaceRole)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
      }

      // Attach member to request for downstream use
      // @ts-ignore
      req.member = member;

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error in role validation' });
    }
  };
};
