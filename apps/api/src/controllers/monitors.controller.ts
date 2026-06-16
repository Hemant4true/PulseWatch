import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { MonitorType, HttpMethod, MonitorStatus } from '@prisma/client';

// Helper to get workspaceId securely
const getWorkspaceId = async (userId: string) => {
  const member = await prisma.workspaceMember.findFirst({ where: { userId } });
  return member?.workspaceId;
};

export const getMonitors = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) return res.status(403).json({ success: false, message: 'No workspace found' });

    const { type, status, search } = req.query;

    let whereClause: any = { workspaceId };
    if (type) whereClause.type = type;
    if (search) whereClause.name = { contains: String(search), mode: 'insensitive' };
    
    let monitors = await prisma.monitor.findMany({
      where: whereClause,
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (status) {
      monitors = monitors.filter(m => {
        const currentStatus = m.checks[0]?.status || MonitorStatus.UNKNOWN;
        return currentStatus === status;
      });
    }

    const data = monitors.map(m => ({
      ...m,
      currentStatus: m.checks[0]?.status || MonitorStatus.UNKNOWN,
      responseTime: m.checks[0]?.responseTime || null,
      checks: undefined // don't send full array
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMonitor = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    const { id } = req.params;

    const monitor = await prisma.monitor.findFirst({
      where: { id, workspaceId },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 50 // Limit to recent 50 for the UI table
        },
        incidents: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!monitor) return res.status(404).json({ success: false, message: 'Monitor not found' });

    res.json({ success: true, data: monitor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

import { z } from 'zod';

const CreateMonitorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(MonitorType).optional(),
  url: z.string().url('Invalid URL'),
  interval: z.number().min(1).max(60).optional(),
  method: z.nativeEnum(HttpMethod).optional()
});

export const createMonitor = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) return res.status(403).json({ success: false, message: 'Forbidden' });

    const parsed = CreateMonitorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }

    const { name, type, url, interval, method } = parsed.data;

    const monitor = await prisma.monitor.create({
      data: {
        workspaceId,
        name,
        type: type || MonitorType.WEBSITE,
        url,
        interval: interval || 5,
        method: method || HttpMethod.GET,
      }
    });

    await prisma.activityLog.create({
      data: { workspaceId, userId, action: 'MONITOR_CREATED', metadata: { monitorName: name } }
    });

    res.status(201).json({ success: true, data: monitor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateMonitorSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  url: z.string().url('Invalid URL').optional(),
  interval: z.number().min(1).max(60).optional(),
  isActive: z.boolean().optional()
});

export const updateMonitor = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    const { id } = req.params;
    
    const parsed = UpdateMonitorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }
    
    const { name, url, interval, isActive } = parsed.data;

    const monitor = await prisma.monitor.findFirst({ where: { id, workspaceId } });
    if (!monitor) return res.status(404).json({ success: false, message: 'Not found' });

    const updated = await prisma.monitor.update({
      where: { id },
      data: { name, url, interval, isActive }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteMonitor = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    const { id } = req.params;

    const monitor = await prisma.monitor.findFirst({ where: { id, workspaceId } });
    if (!monitor) return res.status(404).json({ success: false, message: 'Not found' });

    await prisma.monitor.delete({ where: { id } });

    res.json({ success: true, message: 'Monitor deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const BulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  action: z.enum(['pause', 'resume', 'delete'])
});

export const bulkAction = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    
    const parsed = BulkActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }
    
    const { ids, action } = parsed.data;

    if (action === 'delete') {
      await prisma.monitor.deleteMany({ where: { id: { in: ids }, workspaceId } });
    } else if (action === 'pause') {
      await prisma.monitor.updateMany({ where: { id: { in: ids }, workspaceId }, data: { isActive: false } });
    } else if (action === 'resume') {
      await prisma.monitor.updateMany({ where: { id: { in: ids }, workspaceId }, data: { isActive: true } });
    }

    res.json({ success: true, message: `Bulk ${action} successful` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const TestConnectionSchema = z.object({
  url: z.string().url('Invalid URL'),
  method: z.nativeEnum(HttpMethod).optional()
});

export const testConnection = async (req: Request, res: Response) => {
  try {
    const parsed = TestConnectionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }
    
    const { url, method } = parsed.data;

    const startTime = Date.now();
    const response = await fetch(url, {
      method: method || 'GET',
      headers: { 'User-Agent': 'PulseWatch/1.0' },
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        status: response.ok ? 'UP' : 'DOWN',
        statusCode: response.status,
        responseTime
      }
    });
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        status: 'DOWN',
        statusCode: 0,
        responseTime: 0,
        error: error.message || 'Connection failed'
      }
    });
  }
};
