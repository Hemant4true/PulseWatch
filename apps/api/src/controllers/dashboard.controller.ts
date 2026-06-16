import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { MonitorStatus, IncidentStatus } from '@prisma/client';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    
    // Get user's first workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true }
    });

    if (!workspaceMember) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const workspaceId = workspaceMember.workspaceId;

    // 1. Total Monitors
    const totalMonitors = await prisma.monitor.count({
      where: { workspaceId }
    });

    // 2. Down Now
    const downMonitors = await prisma.monitor.count({
      where: { 
        workspaceId,
        checks: {
          some: {
            status: MonitorStatus.DOWN,
            checkedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // down in last 5 mins
          }
        }
      }
    });

    // 3. Open Incidents
    const openIncidents = await prisma.incident.count({
      where: {
        monitor: { workspaceId },
        status: { in: [IncidentStatus.INVESTIGATING, IncidentStatus.IDENTIFIED, IncidentStatus.MONITORING] }
      }
    });

    // 4. Avg Response Time (last 24 hours)
    const recentChecks = await prisma.monitorCheck.findMany({
      where: {
        monitor: { workspaceId },
        checkedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        responseTime: { not: null }
      },
      select: { responseTime: true }
    });
    const avgResponseTime = recentChecks.length 
      ? Math.round(recentChecks.reduce((acc, check) => acc + (check.responseTime || 0), 0) / recentChecks.length)
      : 0;

    // 5. Uptime % (last 30 days)
    const totalChecks = await prisma.monitorCheck.count({
      where: { monitor: { workspaceId }, checkedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });
    const upChecks = await prisma.monitorCheck.count({
      where: { monitor: { workspaceId }, checkedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: MonitorStatus.UP }
    });
    const uptimePercent = totalChecks ? ((upChecks / totalChecks) * 100).toFixed(2) : '100.00';

    // 6. Activity Feed
    const activityFeed = await prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, avatarUrl: true } } }
    });

    // 7. Recent Alerts
    const recentAlerts = await prisma.alert.findMany({
      where: { workspaceId },
      orderBy: { sentAt: 'desc' },
      take: 5,
      include: { monitor: { select: { name: true } } }
    });

    // 8. Uptime Trend Chart (Last 7 days, daily uptime %)
    // A simple approximation: just returning an array of the last 7 days with random or aggregated data
    // For production we'd group by day. Let's do a simple group by memory for demo
    const chartChecks = await prisma.monitorCheck.findMany({
      where: { monitor: { workspaceId }, checkedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { status: true, checkedAt: true }
    });
    
    const chartDataMap: Record<string, { total: number, up: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      chartDataMap[d.toISOString().split('T')[0]] = { total: 0, up: 0 };
    }

    chartChecks.forEach(c => {
      const dateStr = c.checkedAt.toISOString().split('T')[0];
      if (chartDataMap[dateStr]) {
        chartDataMap[dateStr].total++;
        if (c.status === MonitorStatus.UP) {
          chartDataMap[dateStr].up++;
        }
      }
    });

    const uptimeTrend = Object.keys(chartDataMap).map(date => {
      const stats = chartDataMap[date];
      return {
        date,
        uptime: stats.total ? Number(((stats.up / stats.total) * 100).toFixed(2)) : 100
      };
    });

    return res.json({
      success: true,
      data: {
        workspaceId: workspaceMember.workspaceId,
        workspaceName: workspaceMember.workspace.name,
        totalMonitors,
        downMonitors,
        openIncidents,
        avgResponseTime,
        uptimePercent,
        activityFeed,
        recentAlerts,
        uptimeTrend
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};
