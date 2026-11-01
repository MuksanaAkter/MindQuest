import { config } from "dotenv";
config({ path: "apps/web/.env", quiet: true });
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "apps/server/prisma/schema.prisma",
  migrations: { path: "apps/server/prisma/migrations" },
  // Generation/build do not need a live DB. Migration commands require DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "postgresql://localhost:5432/mindquest" },
});
