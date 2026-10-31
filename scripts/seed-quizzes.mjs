import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";
config({ path: fileURLToPath(new URL("../apps/web/.env", import.meta.url)), quiet: true });
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in apps/web/.env before seeding.");
const catalogue = JSON.parse(await readFile(new URL("../apps/server/prisma/seeds/catalogue.json", import.meta.url), "utf8"));
if (catalogue.length !== 50 || catalogue.some((quiz) => quiz.questions.length !== 15)) throw new Error("Expected 50 complete 15-question quizzes.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query('INSERT INTO "User" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING', ["mindquest-library", "MindQuest Library", "library@mindquest.invalid"]);
  let inserted = 0;
  let refreshed = 0;
  const refresh = process.argv.includes("--refresh-library");
  for (const quiz of catalogue) {
    // Never touch creator-authored rows or overwrite existing published content.
    const result = await client.query('INSERT INTO "Quiz" (id, "creatorId", title, code, questions, timed, published, "createdAt", "builtIn", "seedKey", topic, icon, description, "difficultyLabel") VALUES ($1,$2,$3,$4,$5::jsonb,false,true,NOW(),true,$6,$7,$8,$9,$10) ON CONFLICT ("seedKey") DO NOTHING', [quiz.seedKey, "mindquest-library", quiz.title, quiz.code, JSON.stringify(quiz.questions), quiz.seedKey, quiz.topic, quiz.icon, quiz.description, quiz.difficultyLabel]);
    inserted += result.rowCount ?? 0;
    if (refresh && !result.rowCount) {
      const changed = await client.query('UPDATE "Quiz" SET title=$1, questions=$2::jsonb, description=$3, "difficultyLabel"=$4 WHERE "seedKey"=$5 AND "builtIn"=true AND "creatorId"=$6', [quiz.title, JSON.stringify(quiz.questions), quiz.description, quiz.difficultyLabel, quiz.seedKey, "mindquest-library"]);
      refreshed += changed.rowCount ?? 0;
    }
  }
  await client.query("COMMIT");
  console.log(`Library ready: 50 quizzes, 750 questions; ${inserted} newly inserted, ${refreshed} library entries refreshed. Existing attempts, rewards and creator quizzes preserved.`);
} catch (error) { await client.query("ROLLBACK"); throw error; }
finally { await client.end(); }
