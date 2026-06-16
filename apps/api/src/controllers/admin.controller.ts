import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalWorkspaces = await prisma.workspace.count();
    const totalMonitors = await prisma.monitor.count();
    const totalChecks = await prisma.monitorCheck.count();

    const openIncidents = await prisma.incident.count({ where: { resolvedAt: null } });
    const resolvedIncidents = await prisma.incident.count({ where: { NOT: { resolvedAt: null } } });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalWorkspaces,
        totalMonitors,
        totalChecks,
        openIncidents,
        resolvedIncidents
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: { workspacesOwned: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isSuspended: u.isSuspended,
      createdAt: u.createdAt,
      workspaceCount: u._count.workspacesOwned
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: {
            select: { monitors: true, members: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.workspace.count()
    ]);

    const formattedWorkspaces = workspaces.map(w => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      owner: w.owner,
      createdAt: w.createdAt,
      monitorCount: w._count.monitors,
      memberCount: w._count.members
    }));

    res.json({
      success: true,
      data: {
        workspaces: formattedWorkspaces,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Admin workspaces error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workspaces' });
  }
};

export const toggleSuspend = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'SUPERADMIN') {
      return res.status(400).json({ success: false, message: 'Cannot suspend a SUPERADMIN' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isSuspended: !user.isSuspended },
      select: { id: true, email: true, isSuspended: true }
    });

    res.json({
      success: true,
      message: `User ${updatedUser.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Admin toggle suspend error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};
