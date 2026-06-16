import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import PDFDocument from 'pdfkit';

// Helper to get workspaceId
const getWorkspaceId = async (userId: string) => {
  const member = await prisma.workspaceMember.findFirst({ where: { userId } });
  return member?.workspaceId;
};

const calculateStats = (checks: any[]) => {
  const total = checks.length;
  const upCount = checks.filter(c => c.status === 'UP').length;
  const downEvents = checks.filter(c => c.status === 'DOWN').length;

  let totalResponseTime = 0;
  let countResponseTime = 0;
  checks.forEach(c => {
    if (c.responseTime != null) {
      totalResponseTime += c.responseTime;
      countResponseTime++;
    }
  });

  return {
    uptime: total > 0 ? parseFloat(((upCount / total) * 100).toFixed(2)) : 100,
    avgResponseTime: countResponseTime > 0 ? Math.round(totalResponseTime / countResponseTime) : 0,
    downEvents
  };
};

export const getOverview = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) return res.status(403).json({ success: false, message: 'Forbidden' });

    const monitors = await prisma.monitor.findMany({
      where: { workspaceId },
      select: { id: true, name: true, url: true, type: true }
    });

    const now = Date.now();
    const window30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const result = await Promise.all(monitors.map(async (monitor) => {
      const checks = await prisma.monitorCheck.findMany({
        where: { monitorId: monitor.id, checkedAt: { gte: window30d } },
        orderBy: { checkedAt: 'desc' }
      });

      const checks24h = checks.filter(c => c.checkedAt.getTime() >= now - 24 * 60 * 60 * 1000);
      const checks7d = checks.filter(c => c.checkedAt.getTime() >= now - 7 * 24 * 60 * 60 * 1000);

      // Data for charts in frontend
      // Generate daily points for the 30d line chart
      const dailyMap = new Map<string, { total: number, rt: number, up: number }>();
      checks.forEach(c => {
        const dateStr = c.checkedAt.toISOString().split('T')[0];
        if (!dailyMap.has(dateStr)) dailyMap.set(dateStr, { total: 0, rt: 0, up: 0 });
        const d = dailyMap.get(dateStr)!;
        if (c.responseTime != null) {
          d.rt += c.responseTime;
        }
        d.total++;
        if (c.status === 'UP') d.up++;
      });
      const chartData = Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, d]) => ({
          date,
          avgResponseTime: d.total > 0 ? Math.round(d.rt / d.total) : 0,
          uptime: d.total > 0 ? parseFloat(((d.up / d.total) * 100).toFixed(2)) : 100
        }));

      return {
        monitor,
        stats24h: calculateStats(checks24h),
        stats7d: calculateStats(checks7d),
        stats30d: calculateStats(checks),
        chartData
      };
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    const { monitorId, from, to } = req.query;

    if (!monitorId) return res.status(400).json({ success: false, message: 'monitorId required' });

    const monitor = await prisma.monitor.findFirst({
      where: { id: String(monitorId), workspaceId }
    });
    if (!monitor) return res.status(404).json({ success: false, message: 'Monitor not found' });

    const whereClause: any = { monitorId: monitor.id };
    if (from || to) {
      whereClause.checkedAt = {};
      if (from) whereClause.checkedAt.gte = new Date(String(from));
      if (to) whereClause.checkedAt.lte = new Date(String(to));
    }

    const checks = await prisma.monitorCheck.findMany({
      where: whereClause,
      orderBy: { checkedAt: 'desc' }
    });

    let csv = 'Timestamp,Status,ResponseTimeMs,StatusCode\n';
    checks.forEach(c => {
      csv += `${c.checkedAt.toISOString()},${c.status},${c.responseTime || ''},${c.statusCode || ''}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="monitor-${monitor.id}-export.csv"`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const exportPDF = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    const { monitorId } = req.query;

    if (!monitorId) return res.status(400).json({ success: false, message: 'monitorId required' });

    const monitor = await prisma.monitor.findFirst({
      where: { id: String(monitorId), workspaceId },
      include: {
        incidents: {
          take: 5,
          orderBy: { startedAt: 'desc' }
        }
      }
    });

    if (!monitor) return res.status(404).json({ success: false, message: 'Monitor not found' });

    const window30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const checks = await prisma.monitorCheck.findMany({
      where: { monitorId: monitor.id, checkedAt: { gte: window30d } },
      orderBy: { checkedAt: 'asc' } // Oldest to newest for plotting
    });

    const stats = calculateStats(checks);

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="monitor-${monitor.name.replace(/\s+/g, '-')}-report.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('PulseWatch Monitor Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Monitor: ${monitor.name}`);
    doc.fontSize(10).text(`URL: ${monitor.url}`);
    doc.text(`Type: ${monitor.type}`);
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('30-Day Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Uptime: ${stats.uptime}%`);
    doc.text(`Average Response Time: ${stats.avgResponseTime}ms`);
    doc.text(`Total Downtime Events: ${stats.downEvents}`);
    doc.moveDown(2);

    // Native Vector Chart for Response Time
    doc.fontSize(14).text('Response Time (Last 30 Days)', { underline: true });
    doc.moveDown();

    const chartX = 50;
    const chartY = doc.y;
    const chartW = 500;
    const chartH = 150;

    // Draw axes
    doc.lineWidth(1).strokeColor('#aaaaaa');
    doc.moveTo(chartX, chartY).lineTo(chartX, chartY + chartH).stroke(); // Y
    doc.moveTo(chartX, chartY + chartH).lineTo(chartX + chartW, chartY + chartH).stroke(); // X

    const validChecks = checks.filter(c => c.responseTime != null);
    if (validChecks.length > 1) {
      const maxRt = Math.max(...validChecks.map(c => c.responseTime as number), 100); // minimum scale 100
      const startTime = validChecks[0].checkedAt.getTime();
      const endTime = validChecks[validChecks.length - 1].checkedAt.getTime();
      const timeSpan = Math.max(endTime - startTime, 1);

      doc.lineWidth(1.5).strokeColor('#6366f1'); // Indigo primary color

      let first = true;
      for (const check of validChecks) {
        const x = chartX + ((check.checkedAt.getTime() - startTime) / timeSpan) * chartW;
        const y = chartY + chartH - ((check.responseTime as number) / maxRt) * chartH;
        
        if (first) {
          doc.moveTo(x, y);
          first = false;
        } else {
          doc.lineTo(x, y);
        }
      }
      doc.stroke();
      
      // Label max Y
      doc.fontSize(8).fillColor('#666666').text(`${maxRt}ms`, chartX - 30, chartY - 5);
      doc.text(`0ms`, chartX - 20, chartY + chartH - 5);
    } else {
      doc.fontSize(10).fillColor('#666666').text('Not enough data to render chart.', chartX + 20, chartY + chartH / 2);
    }
    
    doc.moveDown(12); // Move cursor past the chart area
    doc.fillColor('black');

    // Recent Incidents
    doc.fontSize(14).text('Recent Incidents', { underline: true });
    doc.moveDown();

    if (monitor.incidents.length === 0) {
      doc.fontSize(12).text('No recent incidents in the last 30 days.');
    } else {
      monitor.incidents.forEach(inc => {
        doc.fontSize(12).font('Helvetica-Bold').text(inc.title);
        doc.font('Helvetica').fontSize(10).text(`Status: ${inc.status} | Started: ${new Date(inc.startedAt).toLocaleString()}`);
        if (inc.resolvedAt) {
          doc.text(`Resolved: ${new Date(inc.resolvedAt).toLocaleString()}`);
        }
        doc.moveDown(0.5);
      });
    }

    doc.end();

  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
