import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Helper to get workspaceId
const getWorkspaceId = async (userId: string) => {
  const member = await prisma.workspaceMember.findFirst({ where: { userId }, include: { workspace: true } });
  return member?.workspace;
};

export const getStatusPageConfig = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspace = await getWorkspaceId(userId);
    if (!workspace) return res.status(403).json({ success: false, message: 'Forbidden' });

    let statusPage = await prisma.statusPage.findFirst({
      where: { workspaceId: workspace.id }
    });

    if (!statusPage) {
      statusPage = await prisma.statusPage.create({
        data: {
          workspaceId: workspace.id,
          slug: workspace.slug,
          title: `${workspace.name} Status`,
          isPublic: true
        }
      });
    }

    res.json({ success: true, data: statusPage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

import { z } from 'zod';

const UpdateStatusPageConfigSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  isPublic: z.boolean().optional(),
  customDomain: z.string().optional().nullable()
});

export const updateStatusPageConfig = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspace = await getWorkspaceId(userId);
    if (!workspace) return res.status(403).json({ success: false, message: 'Forbidden' });

    const parsed = UpdateStatusPageConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }

    const { title, isPublic, customDomain } = parsed.data;

    const statusPage = await prisma.statusPage.findFirst({ where: { workspaceId: workspace.id } });
    if (!statusPage) return res.status(404).json({ success: false, message: 'Not found' });

    const updated = await prisma.statusPage.update({
      where: { id: statusPage.id },
      data: { title, isPublic, customDomain }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
