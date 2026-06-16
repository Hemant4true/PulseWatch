const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const ws = await prisma.workspace.findFirst({
    include: {
      monitors: {
        where: { isActive: true },
        include: {
          checks: {
            orderBy: { checkedAt: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  if (!ws) {
    console.log("No workspace found.");
    return;
  }

  console.log("Workspace:", ws.name, "| Slug:", ws.slug);
  
  const statusPage = await prisma.statusPage.findFirst({ where: { slug: ws.slug } });
  if (!statusPage) {
     console.log("No status page configured for slug yet. Expected API to auto-create on GET /api/status-pages.");
  }

  let hasOutage = false;
  let hasDegraded = false;

  for (const m of ws.monitors) {
    const latestCheck = m.checks[0];
    const status = latestCheck?.status || 'UNKNOWN';
    console.log(`- Monitor: ${m.name} | Status: ${status}`);
    if (status === 'DOWN') hasOutage = true;
  }

  let overall = 'operational';
  if (hasOutage) overall = 'outage';
  else if (hasDegraded) overall = 'degraded';

  console.log("Calculated Overall Status:", overall);
  process.exit(0);
}

check();
