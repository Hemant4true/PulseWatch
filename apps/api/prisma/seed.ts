// Run: npx tsx prisma/seed.ts
import { PrismaClient, MonitorType, MonitorStatus, IncidentStatus, WorkspaceRole, UserRole, HttpMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing database...');
  await prisma.activityLog.deleteMany();
  await prisma.statusPage.deleteMany();
  await prisma.sSLCheck.deleteMany();
  await prisma.alertPreference.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.monitorCheck.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Database...');

  // 1. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@pulsewatch.app', // Adjusted email for standard use
      passwordHash: '$2b$12$mwpWi2ybFnbopMVzNR0yI.CtJ5WtW85qatRV0BrmkiYra.Orxk0MW', // hashed 'password123'
      role: UserRole.SUPERADMIN,
    },
  });

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Developer',
      email: 'alice@example.com',
      passwordHash: '$2b$12$mwpWi2ybFnbopMVzNR0yI.CtJ5WtW85qatRV0BrmkiYra.Orxk0MW', // hashed 'password123'
      role: UserRole.USER,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Engineer',
      email: 'bob@example.com',
      passwordHash: '$2b$12$mwpWi2ybFnbopMVzNR0yI.CtJ5WtW85qatRV0BrmkiYra.Orxk0MW', // hashed 'password123'
      role: UserRole.USER,
    },
  });

  // 2. Create Workspaces
  const soloWorkspace = await prisma.workspace.create({
    data: {
      name: 'Alice Projects',
      slug: 'alice-projects',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: WorkspaceRole.OWNER },
          { userId: superAdmin.id, role: WorkspaceRole.ADMIN },
        ],
      },
    },
  });

  const teamWorkspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      ownerId: bob.id,
      members: {
        create: [
          { userId: bob.id, role: WorkspaceRole.OWNER },
          { userId: alice.id, role: WorkspaceRole.ADMIN },
          { userId: superAdmin.id, role: WorkspaceRole.ADMIN },
        ],
      },
      statusPages: {
        create: [
          {
            slug: 'acme-status',
            title: 'Acme System Status',
            isPublic: true,
          }
        ]
      }
    },
  });

  // 3. Create Monitors
  const monitorsData = [
    { name: 'GitHub Status', type: MonitorType.WEBSITE, url: 'https://github.com', workspaceId: teamWorkspace.id, method: HttpMethod.GET },
    { name: 'Google', type: MonitorType.WEBSITE, url: 'https://google.com', workspaceId: teamWorkspace.id, method: HttpMethod.GET },
    { name: 'Cloudflare', type: MonitorType.WEBSITE, url: 'https://cloudflare.com', workspaceId: teamWorkspace.id, method: HttpMethod.GET },
    { name: 'HttpBin 200', type: MonitorType.API, url: 'https://httpbin.org/status/200', workspaceId: teamWorkspace.id, method: HttpMethod.GET },
    
    { name: 'Alice Blog', type: MonitorType.WEBSITE, url: 'https://github.com', workspaceId: soloWorkspace.id, method: HttpMethod.GET },
    { name: 'Alice API Backend', type: MonitorType.API, url: 'https://httpbin.org/status/200', workspaceId: soloWorkspace.id, method: HttpMethod.GET },
  ];

  const monitors = [];
  for (const m of monitorsData) {
    monitors.push(await prisma.monitor.create({ data: m }));
  }

  // 4. Generate Monitor Checks (last 30 days, 1 check per hour to avoid massive DB bloat)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const checksToCreate = [];
  
  for (const monitor of monitors) {
    let currentTime = new Date(thirtyDaysAgo);
    let isDown = false;
    let downCounter = 0;
    
    while (currentTime < now) {
      // Simulate random downtime
      if (!isDown && Math.random() < 0.02) { // 2% chance to go down
        isDown = true;
        downCounter = Math.floor(Math.random() * 5) + 1; // Down for 1-5 hours
      }

      let status = MonitorStatus.UP;
      let statusCode = 200;
      let responseTime = Math.floor(Math.random() * 150) + 50; // 50-200ms
      
      if (isDown) {
        status = MonitorStatus.DOWN;
        statusCode = 500;
        responseTime = null;
        downCounter--;
        if (downCounter <= 0) {
          isDown = false;
        }
      } else if (Math.random() < 0.05) { // 5% chance of degraded performance
        status = MonitorStatus.DEGRADED;
        responseTime = Math.floor(Math.random() * 800) + 500; // 500-1300ms
      }

      checksToCreate.push({
        monitorId: monitor.id,
        status,
        responseTime,
        statusCode,
        checkedAt: new Date(currentTime),
      });

      // advance by 1 hour
      currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
    }
  }

  // Insert checks in chunks to avoid limits
  console.log(`Inserting ${checksToCreate.length} monitor checks...`);
  const chunkSize = 5000;
  for (let i = 0; i < checksToCreate.length; i += chunkSize) {
    const chunk = checksToCreate.slice(i, i + chunkSize);
    await prisma.monitorCheck.createMany({ data: chunk });
  }

  // 5. Create Incidents
  // Add some resolved incidents
  await prisma.incident.create({
    data: {
      monitorId: monitors[0].id,
      status: IncidentStatus.RESOLVED,
      title: 'Database connection timeout',
      startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      resolvedAt: new Date(now.getTime() - 4.8 * 24 * 60 * 60 * 1000),
      updates: [
        { timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), message: 'Investigating database timeout', status: 'INVESTIGATING' },
        { timestamp: new Date(now.getTime() - 4.9 * 24 * 60 * 60 * 1000).toISOString(), message: 'Identified root cause as spike in traffic', status: 'IDENTIFIED' },
        { timestamp: new Date(now.getTime() - 4.8 * 24 * 60 * 60 * 1000).toISOString(), message: 'System recovered', status: 'RESOLVED' },
      ],
    }
  });

  // Add 2 open incidents
  await prisma.incident.create({
    data: {
      monitorId: monitors[1].id, // Acme API
      status: IncidentStatus.INVESTIGATING,
      title: 'API returning 502 Bad Gateway',
      startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      updates: [
        { timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), message: 'API is unreachable', status: 'INVESTIGATING' },
      ],
    }
  });

  await prisma.incident.create({
    data: {
      monitorId: monitors[4].id, // Auth Service
      status: IncidentStatus.IDENTIFIED,
      title: 'Auth token generation failing',
      startedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
      updates: [
        { timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), message: 'Users unable to login', status: 'INVESTIGATING' },
        { timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), message: 'Redis cache node failed, restarting', status: 'IDENTIFIED' },
      ],
    }
  });

  // Log some activity
  await prisma.activityLog.createMany({
    data: [
      { workspaceId: teamWorkspace.id, userId: bob.id, action: 'WORKSPACE_CREATED', metadata: { name: 'Acme Corp' } },
      { workspaceId: teamWorkspace.id, userId: alice.id, action: 'MEMBER_JOINED', metadata: { role: 'ADMIN' } },
      { workspaceId: teamWorkspace.id, userId: bob.id, action: 'MONITOR_CREATED', metadata: { monitorName: 'Acme API' } },
      { workspaceId: soloWorkspace.id, userId: alice.id, action: 'WORKSPACE_CREATED', metadata: { name: 'Alice Projects' } },
      { workspaceId: soloWorkspace.id, userId: alice.id, action: 'MONITOR_CREATED', metadata: { monitorName: 'Alice Blog' } },
    ]
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
