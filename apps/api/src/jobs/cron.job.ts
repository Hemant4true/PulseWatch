import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { checkMonitor } from '../services/monitor.service';

export const engineState = {
  cronRunning: false,
  lastCheckAt: null as Date | null,
};

const inProgress = new Set<string>();

export const startCronJobs = () => {
  // Run every minute
  const task = cron.schedule('* * * * *', async () => {
    engineState.lastCheckAt = new Date();
    
    try {
      // Find all active monitors
      const monitors = await prisma.monitor.findMany({
        where: { isActive: true },
        include: {
          checks: {
            orderBy: { checkedAt: 'desc' },
            take: 1
          }
        }
      });

      const now = Date.now();

      for (const monitor of monitors) {
        const lastCheckedAt = monitor.checks[0]?.checkedAt?.getTime() || 0;
        const intervalMs = monitor.interval * 60 * 1000;

        // If it's time to check (or overdue)
        if (now - lastCheckedAt >= intervalMs) {
          
          if (inProgress.has(monitor.id)) {
            console.log(`[CRON] ⚠️ Skipping ${monitor.name} — previous check still in progress`);
            continue;
          }

          inProgress.add(monitor.id);

          // Run asynchronously to not block the cron loop
          checkMonitor(monitor.id)
            .catch(err => console.error(`[CRON] Error checking ${monitor.id}:`, err))
            .finally(() => {
              inProgress.delete(monitor.id);
            });
        }
      }
    } catch (error) {
      console.error('[CRON] Failed to fetch monitors:', error);
    }
  });

  task.start();
  engineState.cronRunning = true;
  console.log('[CRON] Monitoring engine started');
};
