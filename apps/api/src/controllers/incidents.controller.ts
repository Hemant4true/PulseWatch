import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { IncidentStatus } from '@prisma/client';
import { z } from 'zod';

// Helper to get workspaceId
const getWorkspaceId = async (userId: string) => {
  const member = await prisma.workspaceMember.findFirst({ where: { userId } });
  return member?.workspaceId;
};

const UpdateIncidentSchema = z.object({
  status: z.nativeEnum(IncidentStatus).optional(),
  message: z.string().min(1, 'Message is required')
});

const CreateIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().optional(),
  monitorId: z.string().min(1, 'Monitor ID is required'),
  status: z.nativeEnum(IncidentStatus).optional()
});

export const getIncidents = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { status, monitorId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const where: any = { monitor: { workspaceId } };

    if (status) where.status = status;
    if (monitorId) where.monitorId = monitorId;
    
    if (dateFrom || dateTo) {
      where.startedAt = {};
      if (dateFrom) where.startedAt.gte = new Date(String(dateFrom));
      if (dateTo) where.startedAt.lte = new Date(String(dateTo));
    }

    const total = await prisma.incident.count({ where });
    const incidents = await prisma.incident.findMany({
      where,
      include: { monitor: { select: { name: true } } },
      orderBy: { startedAt: 'desc' },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber
    });

    const data = incidents.map(inc => {
      const end = inc.resolvedAt ? new Date(inc.resolvedAt).getTime() : Date.now();
      const start = new Date(inc.startedAt).getTime();
      return {
        ...inc,
        duration: end - start,
        updates: undefined // Omit large payload from list
      };
    });

    res.json({
      success: true,
      data,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getIncident = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    const { id } = req.params;

    const incident = await prisma.incident.findFirst({
      where: { id, monitor: { workspaceId } },
      include: {
        monitor: { select: { id: true, name: true, url: true, type: true } }
      }
    });

    if (!incident) return res.status(404).json({ success: false, message: 'Not found' });

    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateIncident = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    const { id } = req.params;
    
    const parsed = UpdateIncidentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }
    
    const { status, message } = parsed.data;

    const incident = await prisma.incident.findFirst({ where: { id, monitor: { workspaceId } } });
    if (!incident) return res.status(404).json({ success: false, message: 'Not found' });

    const newUpdate = {
      timestamp: new Date().toISOString(),
      message,
      status: status || incident.status
    };

    let updates: any[] = [];
    if (incident.updates) {
      if (Array.isArray(incident.updates)) updates = incident.updates;
      else updates = [incident.updates];
    }
    updates.push(newUpdate);

    const dataToUpdate: any = {
      updates,
      status: status || incident.status
    };

    if (status === IncidentStatus.RESOLVED && incident.status !== IncidentStatus.RESOLVED) {
      dataToUpdate.resolvedAt = new Date();
    } else if (status && status !== IncidentStatus.RESOLVED && incident.status === IncidentStatus.RESOLVED) {
      dataToUpdate.resolvedAt = null; // Re-opened
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: dataToUpdate
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createIncident = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) return res.status(403).json({ success: false, message: 'Forbidden' });

    const parsed = CreateIncidentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }

    const { title, message, monitorId, status } = parsed.data;

    // Verify it belongs to workspace
    const monitor = await prisma.monitor.findFirst({ where: { id: monitorId, workspaceId } });
    if (!monitor) return res.status(404).json({ success: false, message: 'Monitor not found' });

    const initialUpdate = {
      timestamp: new Date().toISOString(),
      message: message || 'Incident created manually.',
      status: status || IncidentStatus.INVESTIGATING
    };

    const incident = await prisma.incident.create({
      data: {
        monitorId: monitorId,
        status: status || IncidentStatus.INVESTIGATING,
        title,
        updates: [initialUpdate],
        startedAt: new Date(),
        resolvedAt: status === IncidentStatus.RESOLVED ? new Date() : null
      }
    });

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
