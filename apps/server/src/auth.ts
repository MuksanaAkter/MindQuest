import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDb } from "./db";
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !baseURL) {
    throw new Error("Set BETTER_AUTH_URL and a random BETTER_AUTH_SECRET (32+ characters) in .env.");
  }
  return betterAuth({
    appName: "MindQuest", baseURL, secret,
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
  });
}
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return auth ??= createAuth(); }
