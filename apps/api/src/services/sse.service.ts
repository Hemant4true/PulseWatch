import { Response } from 'express';
import { getPublicStatusData } from '../controllers/public.controller';

const clients = new Map<string, Set<Response>>();

export const addSSEClient = (slug: string, res: Response) => {
  if (!clients.has(slug)) {
    clients.set(slug, new Set());
  }
  clients.get(slug)!.add(res);

  res.on('close', () => {
    clients.get(slug)?.delete(res);
    if (clients.get(slug)?.size === 0) {
      clients.delete(slug);
    }
  });
};

export const broadcastToSlug = async (slug: string) => {
  const set = clients.get(slug);
  if (!set || set.size === 0) return;

  try {
    const data = await getPublicStatusData(slug);
    if (!data) return;

    const message = `data: ${JSON.stringify({ type: 'status_update', payload: data })}\n\n`;
    set.forEach(client => {
      client.write(message);
    });
  } catch (error) {
    console.error(`[SSE] Failed to broadcast to ${slug}:`, error);
  }
};

setInterval(() => {
  for (const slug of clients.keys()) {
    broadcastToSlug(slug);
  }
}, 60000);
