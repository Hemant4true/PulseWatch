import { prisma } from '../lib/prisma';
import { sendEmail, templates } from '../lib/mailer';

export const shouldSendAlert = async (monitorId: string, alertType: string): Promise<boolean> => {
  // Deduplication: Check if same alert type was sent within last 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const recentAlert = await prisma.alert.findFirst({
    where: {
      monitorId,
      type: alertType,
      sentAt: { gte: fifteenMinutesAgo }
    }
  });

  return !recentAlert;
};

const getEmailsToNotify = async (workspaceId: string, alertType: string): Promise<string[]> => {
  const preferences = await prisma.alertPreference.findMany({
    where: {
      workspaceId,
      emailEnabled: true,
      notifyOn: { has: alertType }
    },
    include: { user: { select: { email: true } } }
  });

  return preferences.map(p => p.user.email);
};

export const sendMonitorDownAlert = async (monitor: any, incident: any, errorMsg?: string) => {
  const alertType = 'DOWN';
  if (!(await shouldSendAlert(monitor.id, alertType))) return;

  const emails = await getEmailsToNotify(monitor.workspaceId, alertType);
  if (emails.length === 0) return;

  const html = monitor.type === 'API' && errorMsg
    ? templates.apiFailure(monitor.url, 0, errorMsg)
    : templates.monitorDown(monitor.name, monitor.url, new Date(incident.startedAt).toLocaleString());

  const subject = `[DOWN] Monitor ${monitor.name} is offline`;

  for (const email of emails) {
    await sendEmail(email, subject, html);
  }

  await prisma.alert.create({
    data: {
      workspaceId: monitor.workspaceId,
      monitorId: monitor.id,
      type: alertType,
      channel: 'EMAIL',
      payload: { emailsCount: emails.length }
    }
  });

  import('./dashboardSse.service').then(({ broadcastToWorkspace }) => {
    broadcastToWorkspace(monitor.workspaceId, 'new_alert', {
      alertType,
      monitorName: monitor.name
    });
  });
};

export const sendMonitorUpAlert = async (monitor: any, incident: any) => {
  const alertType = 'UP';
  if (!(await shouldSendAlert(monitor.id, alertType))) return;

  const emails = await getEmailsToNotify(monitor.workspaceId, alertType);
  if (emails.length === 0) return;

  const downtimeDurationMs = Date.now() - new Date(incident.startedAt).getTime();
  const downtimeMinutes = Math.round(downtimeDurationMs / 60000);
  const durationStr = downtimeMinutes > 60 ? `${(downtimeMinutes / 60).toFixed(1)} hours` : `${downtimeMinutes} minutes`;

  const html = templates.monitorUp(monitor.name, durationStr);
  const subject = `[UP] Monitor ${monitor.name} is back online`;

  for (const email of emails) {
    await sendEmail(email, subject, html);
  }

  await prisma.alert.create({
    data: {
      workspaceId: monitor.workspaceId,
      monitorId: monitor.id,
      type: alertType,
      channel: 'EMAIL',
      payload: { emailsCount: emails.length }
    }
  });

  import('./dashboardSse.service').then(({ broadcastToWorkspace }) => {
    broadcastToWorkspace(monitor.workspaceId, 'new_alert', {
      alertType,
      monitorName: monitor.name
    });
  });
};

export const sendSSLExpiryAlert = async (monitor: any, daysRemaining: number) => {
  const alertType = 'SSL_EXPIRING';
  if (!(await shouldSendAlert(monitor.id, alertType))) return;

  const emails = await getEmailsToNotify(monitor.workspaceId, alertType);
  if (emails.length === 0) return;

  const html = templates.sslExpiring(monitor.url, daysRemaining);
  const subject = `[WARNING] SSL Certificate for ${monitor.name} expiring in ${daysRemaining} days`;

  for (const email of emails) {
    await sendEmail(email, subject, html);
  }

  await prisma.alert.create({
    data: {
      workspaceId: monitor.workspaceId,
      monitorId: monitor.id,
      type: alertType,
      channel: 'EMAIL',
      payload: { emailsCount: emails.length }
    }
  });

  import('./dashboardSse.service').then(({ broadcastToWorkspace }) => {
    broadcastToWorkspace(monitor.workspaceId, 'new_alert', {
      alertType,
      monitorName: monitor.name
    });
  });
};
