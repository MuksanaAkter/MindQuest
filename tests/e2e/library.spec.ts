import { test, expect, type APIRequestContext } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";
import type { ArenaView } from "@mindquest/server/arena/contracts";
import type { PublicQuiz, PlayerState } from "@mindquest/server/quizzes/contracts";
config({ path: "apps/web/.env", quiet: true });
type PrivateState = { index: number; questions: { choices: { id: string; option: number }[] }[] };
async function finish(pool: Pool, request: APIRequestContext, code: string, correctCount: number, avatar = "owl") {
  const started = await request.post("/api/quizzes/join", { data: { code, name: "Library Explorer", avatar } });
  expect(started.ok()).toBeTruthy(); let round: ArenaView = ((await started.json()) as { attempt: ArenaView }).attempt;
  expect(round.total).toBe(15);
  for (let i = 0; i < 15; i++) {
    const rows = await pool.query<{ state: PrivateState }>('SELECT state FROM "GameAttempt" WHERE id=$1', [round.id]);
    const choices = rows.rows[0].state.questions[i].choices;
    const choice = choices.find((c) => c.option === (i < correctCount ? 0 : 1))!;
    const data = { action: "answer", questionId: round.question!.id, choiceId: choice.id };
    const replies = await Promise.all([request.post(`/api/arena/${round.id}`, { data }), request.post(`/api/arena/${round.id}`, { data })]);
    expect(replies.every((r) => r.ok())).toBe(true);
    const view: ArenaView = await replies[0].json(); expect(view.reviews).toHaveLength(i + 1);
    const moved = await request.post(`/api/arena/${round.id}`, { data: { action: "next", questionId: data.questionId } });
    round = await moved.json();
  }
  return round;
}
test("seed library rewards best-score improvements, unlocks avatars once, and persists levels without login", async ({ request, page }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs migrated and seeded PostgreSQL."); test.setTimeout(90000);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL }); let ownerKey: string | undefined;
  try {
    const initial: PlayerState = await (await request.get("/api/player")).json(); expect(initial.level).toBe(1);
    const guest = (await request.storageState()).cookies.find((cookie) => cookie.name === "mq_guest")!; ownerKey = `guest:${guest.value}`;
    const catalogue = (await (await request.get("/api/quizzes/public")).json()) as { quizzes: PublicQuiz[] };
    const seeded = catalogue.quizzes.filter((q) => q.builtIn); expect(seeded).toHaveLength(50); expect(seeded.every((q) => q.questionCount === 15)).toBe(true);
    expect((await request.post("/api/quizzes/join", { data: { code: seeded[0].code, name: "Explorer", avatar: "phoenix" } })).status()).toBe(403);
    const first = await finish(pool, request, seeded[0].code, 13); expect(first.playerReward?.xp).toBe(130); expect(first.playerReward?.unlockedAvatar).toBeNull();
    const improved = await finish(pool, request, seeded[0].code, 14); expect(improved.playerReward?.xp).toBe(110); expect(improved.playerReward?.coins).toBe(52); expect(improved.playerReward?.unlockedAvatar).toBe("phoenix");
    const repeated = await finish(pool, request, seeded[0].code, 14, "phoenix"); expect(repeated.playerReward?.xp).toBe(0); expect(repeated.playerReward?.coins).toBe(0); expect(repeated.playerReward?.unlockedAvatar).toBeNull();
    const next = await finish(pool, request, seeded[1].code, 15, "phoenix"); expect(next.playerReward?.unlockedAvatar).toBe("robot"); expect(next.playerReward?.level).toBe(2);
    const saved: PlayerState = await (await request.get("/api/player")).json(); expect(saved.totalXp).toBe(490); expect(saved.coins).toBe(158); expect(saved.masteredQuizzes).toBe(2); expect(saved.unlockedAvatars).toContain("phoenix"); expect(saved.bestByQuiz[seeded[0].id]).toBe(93);
    const restored: ArenaView = await (await request.get(`/api/arena/${next.id}`)).json(); expect(restored.playerReward).toEqual(next.playerReward);
    await page.context().addCookies((await request.storageState()).cookies);
    await page.goto(`/play/${next.id}`);
    await expect(page.getByRole("region", { name: "Your quiz rewards", exact: true })).toBeVisible();
    await expect(page.getByText("New avatar unlocked: robot!", { exact: true })).toBeVisible();
    await expect(page.getByText("Level up! You’re now a level 2 explorer.", { exact: false })).toBeVisible();
    await page.getByRole("link", { name: "Join another quiz", exact: true }).click();
    await expect(page).toHaveURL(/\/#join-quiz$/);
    await page.getByRole("button", { name: "Choose robot avatar", exact: true }).click();
    await expect(page.getByRole("button", { name: "robot avatar", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/me");
    await expect(page.getByRole("heading", { name: "My past games", exact: true })).toBeVisible();
    await expect(page.locator(".adventure-record")).toHaveCount(4);
    await expect(page.getByRole("link", { name: "Play with robot", exact: true })).toBeVisible();
    await expect(page.getByText("Level 2", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.locator(".adventure-record")).toHaveCount(4);
    await page.locator(".adventure-record").first().getByRole("link", { name: "See my result", exact: true }).click();
    await expect(page.getByRole("complementary", { name: "Game navigation" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "My adventure", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Create a quiz", exact: true })).toHaveCount(0);
    // More than one history page must remain visible, without another browser's records.
    await pool.query('INSERT INTO "GameAttempt" (id,"ownerKey","quizId","participantName","participantAvatar",mode,config,state,score,"correctCount","bestStreak","xpAwarded","startedAt","completedAt") SELECT $1 || n, "ownerKey","quizId","participantName","participantAvatar",mode,config,state,score,"correctCount","bestStreak","xpAwarded",NOW(),NOW() FROM "GameAttempt" CROSS JOIN generate_series(1,31) AS n WHERE id=$2', [`history-${next.id}-`, next.id]);
    const history = await (await request.get("/api/player/history")).json();
    expect(history.totalAttempts).toBe(35); expect(history.attempts).toHaveLength(30);
    expect(history.attempts[0]).not.toHaveProperty("state");
    const older = await (await request.get(`/api/player/history?cursor=${history.nextCursor}`)).json();
    expect(older.attempts).toHaveLength(5); expect(older.nextCursor).toBeNull();
    expect(new Set([...history.attempts, ...older.attempts].map((a: { id: string }) => a.id)).size).toBe(35);
    const other = await page.context().browser()!.newContext();
    try { expect((await other.request.get(`http://localhost:3000/api/player/history?cursor=${next.id}`)).status()).toBe(404); }
    finally { await other.close(); }



  } finally {
    if (ownerKey) { await pool.query('DELETE FROM "GameAttempt" WHERE "ownerKey"=$1', [ownerKey]); await pool.query('DELETE FROM "PlayerProfile" WHERE "ownerKey"=$1', [ownerKey]); }
    await pool.end();
  }
});
test("kids library supports topic filters, search, quest selection, locked friends, and mobile layout", async ({ page }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs seeded PostgreSQL.");
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Math", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play Adding Numbers", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Play Adding Numbers", exact: true }).click();
  await expect(page.getByLabel("Quiz code", { exact: true })).toHaveValue("MQLIBAAA");
  await expect(page.getByRole("button", { name: "Locked phoenix avatar", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "All quests", exact: true }).click();
  await page.getByRole("textbox", { name: "Search quizzes" }).fill("Solar System");
  await expect(page.getByRole("button", { name: "Play Planets in Our Solar System", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
