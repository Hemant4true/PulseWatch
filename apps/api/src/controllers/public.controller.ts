import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { addSSEClient } from '../services/sse.service';
import { MonitorStatus, IncidentStatus } from '@prisma/client';

export const getPublicStatusData = async (slug: string) => {
  const statusPage = await prisma.statusPage.findUnique({
    where: { slug },
    include: {
      workspace: {
        include: {
          monitors: {
            where: { isActive: true },
            include: {
              checks: {
                where: {
                  checkedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
                },
                orderBy: { checkedAt: 'desc' }
              }
            }
          },
          alerts: false
        }
      }
    }
  });

  if (!statusPage || !statusPage.isPublic) return null;

  let overallStatus = 'operational';
  let hasDegraded = false;
  let hasOutage = false;

  const services = statusPage.workspace.monitors.map(monitor => {
    const latestCheck = monitor.checks[0];
    const status = latestCheck?.status || 'UNKNOWN';

    // Calculate Uptime 30d
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const checks30d = monitor.checks.filter(c => c.checkedAt.getTime() >= thirtyDaysAgo);
    const upChecks = checks30d.filter(c => c.status === MonitorStatus.UP).length;
    const uptime30d = checks30d.length > 0 ? (upChecks / checks30d.length) * 100 : 100;

    // Calculate Avg Response Time
    const avgResponseTime = checks30d.length > 0 
      ? checks30d.reduce((sum, c) => sum + (c.responseTime || 0), 0) / checks30d.length 
      : 0;

    if (status === MonitorStatus.DOWN) hasOutage = true;
    if (avgResponseTime > 2000 && status === MonitorStatus.UP) hasDegraded = true;

    return {
      id: monitor.id,
      name: monitor.name,
      type: monitor.type,
      url: monitor.url,
      status,
      uptime30d: parseFloat(uptime30d.toFixed(2)),
      responseTime: Math.round(avgResponseTime)
    };
  });

  if (hasOutage) overallStatus = 'outage';
  else if (hasDegraded) overallStatus = 'degraded';

  // 90-day history arrays for each monitor
  const uptimeHistory: Record<string, { date: string, uptime: number }[]> = {};
  
  const now = new Date();
  const ninetyDaysArray = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (89 - i));
    return d.toISOString().split('T')[0];
  });

  statusPage.workspace.monitors.forEach(monitor => {
    const historyMap = new Map<string, { total: number, up: number }>();
    monitor.checks.forEach(check => {
      const dateStr = check.checkedAt.toISOString().split('T')[0];
      if (!historyMap.has(dateStr)) historyMap.set(dateStr, { total: 0, up: 0 });
      const stats = historyMap.get(dateStr)!;
      stats.total++;
      if (check.status === MonitorStatus.UP) stats.up++;
    });

    uptimeHistory[monitor.id] = ninetyDaysArray.map(dateStr => {
      const stats = historyMap.get(dateStr);
      const uptime = stats && stats.total > 0 ? (stats.up / stats.total) * 100 : -1; // -1 for no data
      return { date: dateStr, uptime };
    });
  });

  // Incidents
  const monitorIds = statusPage.workspace.monitors.map(m => m.id);
  const incidents = await prisma.incident.findMany({
    where: { monitorId: { in: monitorIds } },
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: { monitor: { select: { name: true } } }
  });

  return {
    page: { title: statusPage.title, slug: statusPage.slug },
    overallStatus,
    services,
    incidents,
    uptimeHistory
  };
};

export const getPublicStatus = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const data = await getPublicStatusData(slug);
    
    if (!data) return res.status(404).json({ success: false, message: 'Status page not found' });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sseStatus = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Ensure headers are sent immediately

    addSSEClient(slug, res);

    // Send initial payload
    const data = await getPublicStatusData(slug);
    if (data) {
      res.write(`data: ${JSON.stringify({ type: 'status_update', payload: data })}\n\n`);
    }

  } catch (error) {
    res.status(500).end();
  }
};
