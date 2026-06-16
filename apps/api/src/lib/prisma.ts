import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl.includes('6543') && !databaseUrl.includes('pgbouncer=true')) {
  const separator = databaseUrl.includes('?') ? '&' : '?';
  databaseUrl += `${separator}pgbouncer=true&connection_limit=1`;
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});
