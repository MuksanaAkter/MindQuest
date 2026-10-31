import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
const globalForDb = globalThis as unknown as { prisma?: PrismaClient };
export function getDb() {
  if (globalForDb.prisma) return globalForDb.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Set DATABASE_URL in .env before using database features.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  globalForDb.prisma = db;
  return db;
}
