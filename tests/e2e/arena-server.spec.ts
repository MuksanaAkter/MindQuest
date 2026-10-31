import { test, expect, type APIRequestContext } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";
import type { ArenaView } from "@mindquest/server/arena/contracts";
loadEnv({ path: "apps/web/.env", quiet: true });
type InternalState = { questions: { id: string; choices: { id: string; option: number }[] }[]; index: number };
async function correctChoice(pool: Pool, round: ArenaView) {
  const rows = await pool.query<{ state: InternalState }>('SELECT state FROM "GameAttempt" WHERE id = $1', [round.id]);
  return rows.rows[0].state.questions[round.index].choices.find((choice) => choice.option === 0)!.id;
}
async function complete(pool: Pool, request: APIRequestContext, daily: boolean) {
  const started = await request.post("/api/arena", { data: { category: "science", difficulty: "EASY", timed: false, daily } });
  expect(started.status()).toBe(200); let round: ArenaView = await started.json();
  for (let index = 0; index < 5; index++) {
    const body = { action: "answer", questionId: round.question!.id, choiceId: await correctChoice(pool, round) };
    const responses = await Promise.all([request.post(`/api/arena/${round.id}`, { data: body }), request.post(`/api/arena/${round.id}`, { data: body })]);
    expect(responses.every((r) => r.ok())).toBeTruthy();
    const [first, duplicate]: ArenaView[] = await Promise.all(responses.map((r) => r.json()));
    expect(first.score).toBe(duplicate.score); expect(first.reviews).toHaveLength(index + 1);
    const next = await request.post(`/api/arena/${round.id}`, { data: { action: "next", questionId: body.questionId } });
    expect(next.ok()).toBeTruthy(); round = await next.json();
  }
  return round;
}
test("account rewards commit once, daily repeats give no XP, and server deadlines win", async ({ request }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs a migrated disposable database.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let userId: string | null = null;
  try {
    const signup = await request.post("/api/auth/sign-up/email", { data: { name: "Arena Test", email: `arena-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`, password: "Test-password-42!" }, headers: { Origin: "http://localhost:3000" } });
    expect(signup.ok()).toBeTruthy(); userId = ((await signup.json()) as { user: { id: string } }).user.id;
    const practice = await complete(pool, request, false);
    expect(practice.score).toBe(750); expect(practice.xpAwarded).toBe(75); expect(practice.phase).toBe("results");
    const daily = await complete(pool, request, true); expect(daily.xpAwarded).toBe(100);
    const repeated = await complete(pool, request, true); expect(repeated.xpAwarded).toBe(0);
    const progress = await pool.query<{ totalXp: number }>('SELECT "totalXp" FROM "Progress" WHERE "userId" = $1', [userId]);
    expect(progress.rows[0].totalXp).toBe(175);
    const rewards = await pool.query<{ count: string }>('SELECT COUNT(*) FROM "GameReward" WHERE "userId" = $1', [userId]);
    expect(Number(rewards.rows[0].count)).toBe(2);
    const started = await request.post("/api/arena", { data: { category: "mixed", difficulty: "HARD", timed: true, daily: false } });
    const timed: ArenaView = await started.json(); const choiceId = await correctChoice(pool, timed);
    await pool.query('UPDATE "GameAttempt" SET state = jsonb_set(state, \'{questionStartedAt}\', to_jsonb($2::text)) WHERE id = $1', [timed.id, new Date(Date.now() - 60000).toISOString()]);
    const expired = await request.post(`/api/arena/${timed.id}`, { data: { action: "answer", questionId: timed.question!.id, choiceId } });
    const feedback: ArenaView = await expired.json(); expect(feedback.feedback?.timedOut).toBe(true); expect(feedback.score).toBe(0);
    const forbidden = await request.post("/api/arena", { data: { category: "mixed", difficulty: "HARD", timed: false, daily: false }, headers: { Origin: "https://untrusted.example" } });
    expect(forbidden.status()).toBe(403);
  } finally {
    if (userId) await pool.query('DELETE FROM "User" WHERE id = $1', [userId]);
    await pool.end();
  }
});

test("mobile timed play submits expiration and starts a fresh clock on the next question", async ({ page }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs a migrated disposable database.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/arena");
    await expect(page.getByRole("button", { name: "Begin expedition" })).toBeEnabled();
    const started = await page.request.post("/api/arena", { data: { category: "science", difficulty: "HARD", timed: true, daily: false } });
    const round: ArenaView = await started.json();
    await pool.query('UPDATE "GameAttempt" SET state = jsonb_set(state, \'{questionStartedAt}\', to_jsonb($2::text)) WHERE id = $1', [round.id, new Date(Date.now() - 60000).toISOString()]);
    await page.reload();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("heading", { name: "The hourglass ran out." })).toBeVisible();
    await page.getByRole("button", { name: "Next discovery", exact: true }).click();
    await expect(page.getByRole("group", { name: "Answer choices" })).toBeVisible();
    await expect(page.getByText("QUESTION 02 / 05", { exact: false })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  } finally { await pool.end(); }
});
