import { Response } from 'express';

const clients = new Map<string, Set<Response>>();

export const addDashboardClient = (workspaceId: string, res: Response) => {
  if (!clients.has(workspaceId)) {
    clients.set(workspaceId, new Set());
  }
  clients.get(workspaceId)!.add(res);

  res.on('close', () => {
    clients.get(workspaceId)?.delete(res);
    if (clients.get(workspaceId)?.size === 0) {
      clients.delete(workspaceId);
    }
  });
};

export const broadcastToWorkspace = (workspaceId: string, eventType: string, payload: any) => {
  const set = clients.get(workspaceId);
  if (!set || set.size === 0) return;

  const message = `data: ${JSON.stringify({ type: eventType, payload })}\n\n`;
  set.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      // Ignore client write errors
    }
  });
};

// Send heartbeat every 30s to keep connections alive
setInterval(() => {
  for (const set of clients.values()) {
    set.forEach(client => {
      try {
        client.write(': heartbeat\n\n');
      } catch (error) {}
    });
  }
}, 30000);
