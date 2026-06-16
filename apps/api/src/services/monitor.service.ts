import { prisma } from '../lib/prisma';
import { MonitorType, MonitorStatus, HttpMethod, IncidentStatus } from '@prisma/client';
import tls from 'tls';
import { sendMonitorDownAlert, sendMonitorUpAlert } from './alert.service';
import { broadcastToSlug } from './sse.service';

export const checkMonitor = async (monitorId: string) => {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    include: {
      checks: {
        orderBy: { checkedAt: 'desc' },
        take: 1
      }
    }
  });

  if (!monitor) return;

  const lastCheckStatus = monitor.checks[0]?.status || MonitorStatus.UNKNOWN;
  let currentStatus: MonitorStatus = MonitorStatus.UNKNOWN;
  let responseTime = 0;
  let statusCode = 0;
  let errorMessage = '';

  const startTime = Date.now();

  try {
    if (monitor.type === MonitorType.WEBSITE || monitor.type === MonitorType.API) {
      const response = await fetch(monitor.url, {
        method: monitor.method || HttpMethod.GET,
        headers: { 'User-Agent': 'PulseWatch/1.0 (Cron)' },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      
      responseTime = Date.now() - startTime;
      statusCode = response.status;
      currentStatus = response.ok ? MonitorStatus.UP : MonitorStatus.DOWN;
    } 
    else if (monitor.type === MonitorType.SSL) {
      // Parse hostname from URL
      const urlObj = new URL(monitor.url.startsWith('http') ? monitor.url : `https://${monitor.url}`);
      const hostname = urlObj.hostname;
      const port = parseInt(urlObj.port) || 443;

      currentStatus = await new Promise<MonitorStatus>((resolve) => {
        const socket = tls.connect({
          host: hostname,
          port: port,
          servername: hostname, // Required for SNI
          rejectUnauthorized: true, // We want to ensure the cert is valid
        }, () => {
          responseTime = Date.now() - startTime;
          statusCode = 200;
          socket.end();
          resolve(MonitorStatus.UP);
        });

        socket.on('error', (err: any) => {
          responseTime = Date.now() - startTime;
          errorMessage = err.message;
          resolve(MonitorStatus.DOWN);
        });

        socket.setTimeout(10000, () => {
          responseTime = Date.now() - startTime;
          errorMessage = 'timeout';
          socket.destroy();
          resolve(MonitorStatus.DOWN);
        });
      });
    }
  } catch (err: any) {
    responseTime = Date.now() - startTime;
    errorMessage = err.name === 'TimeoutError' ? 'timeout' : (err.message || 'Error');
    currentStatus = MonitorStatus.DOWN;
  }

  // Record Check
  await prisma.monitorCheck.create({
    data: {
      monitorId: monitor.id,
      status: currentStatus,
      responseTime,
      statusCode,
    }
  });

  // Incident Logic
  if (currentStatus === MonitorStatus.DOWN && lastCheckStatus !== MonitorStatus.DOWN) {
    // UP -> DOWN
    const timestamp = new Date().toISOString();
    const newIncident = await prisma.incident.create({
      data: {
        monitorId: monitor.id,
        status: IncidentStatus.INVESTIGATING,
        title: `${monitor.name} is down`,
        updates: [{
          timestamp: new Date().toISOString(),
          message: `Monitor failed to respond correctly. Detected at ${timestamp}. Error: ${errorMessage}`,
          status: IncidentStatus.INVESTIGATING
        }],
        startedAt: new Date()
      }
    });

    import('./dashboardSse.service').then(({ broadcastToWorkspace }) => {
      broadcastToWorkspace(monitor.workspaceId, 'new_incident', {
        incidentId: newIncident.id,
        monitorName: monitor.name,
        title: newIncident.title
      });
    });

    await sendMonitorDownAlert(monitor, newIncident, errorMessage);
  } 
  else if (currentStatus === MonitorStatus.UP && lastCheckStatus === MonitorStatus.DOWN) {
    // DOWN -> UP
    const openIncident = await prisma.incident.findFirst({
      where: {
        monitorId: monitor.id,
        status: { not: IncidentStatus.RESOLVED }
      },
      orderBy: { startedAt: 'desc' }
    });

    if (openIncident) {
      const resolvedIncident = await prisma.incident.update({
        where: { id: openIncident.id },
        data: {
          status: IncidentStatus.RESOLVED,
          resolvedAt: new Date()
        }
      });

      import('./dashboardSse.service').then(({ broadcastToWorkspace }) => {
        broadcastToWorkspace(monitor.workspaceId, 'incident_resolved', {
          incidentId: resolvedIncident.id,
          monitorName: monitor.name
        });
      });

      await sendMonitorUpAlert(monitor, resolvedIncident);
    }
  }

  if (currentStatus !== lastCheckStatus) {
    const ws = await prisma.workspace.findUnique({ where: { id: monitor.workspaceId } });
    if (ws) {
      await broadcastToSlug(ws.slug);
      
      // Dashboard Real-time SSE
      import('./dashboardSse.service').then(({ broadcastToWorkspace }) => {
        broadcastToWorkspace(ws.id, 'monitor_status_changed', {
          monitorId: monitor.id,
          monitorName: monitor.name,
          oldStatus: lastCheckStatus,
          newStatus: currentStatus
        });
      });
    }
  }

  // Console output
  const icon = currentStatus === MonitorStatus.UP ? '✅' : '❌';
  const displayTime = errorMessage === 'timeout' ? 'timeout' : `${responseTime}ms`;
  const domain = monitor.url.replace(/^https?:\/\//, '').split('/')[0];
  console.log(`[CRON] ${icon} ${domain} — ${displayTime} | ${currentStatus}`);
};
