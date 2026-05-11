import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not set");
  }
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

// Proxy delays client creation until the first property access — so route
// handlers and pages don't throw at module load when env vars are absent
// (e.g. during `next build` page-data collection on a freshly-cloned tree).
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = makeClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop, globalForPrisma.prisma);
  },
});
