import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";
import type { ArenaView } from "@mindquest/server/arena/contracts";
import type { QuizScoreboard } from "@mindquest/server/quizzes/contracts";
config({ path: "apps/web/.env", quiet: true });
test.use({ extraHTTPHeaders: { "x-forwarded-for": "192.0.2.74" } });

test("quiz scoreboard ranks unique completed players, paginates, and exposes only public fields", async ({ page, playwright }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs a disposable migrated database.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const visitor = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
  const prefix = `board-${Date.now()}-`;
  let creatorId: string | undefined; let viewer: string | undefined;
  try {
    const signup = await page.request.post("/api/auth/sign-up/email", { data: { name: "Board Creator", email: `${prefix}creator@example.com`, password: "Test-password-42!" }, headers: { Origin: "http://localhost:3000" } });
    expect(signup.ok()).toBe(true); creatorId = (await signup.json()).user.id;
    const input = { title: "Friends of the forest", timed: false, questions: [{ prompt: "Which animal has wings?", options: ["Owl", "Fox", "Cat", "Dog"], correctIndex: 0, explanation: "Owls have wings." }] };
    const created = await page.request.post("/api/quizzes", { data: input }); expect(created.ok()).toBe(true); const quiz = await created.json();
    const other = await page.request.post("/api/quizzes", { data: { ...input, title: "Another quiz" } }); const otherQuiz = await other.json();
    const joined = await page.request.post("/api/quizzes/join", { data: { code: quiz.code, name: "Board Explorer", avatar: "fox" } });
    const round: ArenaView = (await joined.json()).attempt;
    const guest = (await page.context().cookies()).find((cookie) => cookie.name === "mq_guest")!; viewer = `guest:${guest.value}`;
    const answer = round.question!.options.find((option) => option.text === "Owl")!;
    await page.request.post(`/api/arena/${round.id}`, { data: { action: "answer", questionId: round.question!.id, choiceId: answer.id } });
    await page.request.post(`/api/arena/${round.id}`, { data: { action: "next", questionId: round.question!.id } });
    await pool.query('UPDATE "GameAttempt" SET score=9999 WHERE id=$1', [round.id]);
    await pool.query('UPDATE "PlayerProfile" SET "totalXp"=1800 WHERE "ownerKey"=$1', [viewer]);
    await pool.query('INSERT INTO "PlayerProfile" (id,"ownerKey",name,"totalXp","updatedAt") SELECT $1||n,$1||n,\'Rival \'||n,n*300,NOW() FROM generate_series(1,34) n', [prefix]);
    await pool.query('INSERT INTO "GameAttempt" (id,"ownerKey","quizId","participantName","participantAvatar",config,state,score,"correctCount","completedAt") SELECT $1||n,$1||n,$2,\'Rival \'||n,\'owl\',\'{}\',\'{}\',1000+n,1,NOW() FROM generate_series(1,34) n', [prefix, quiz.id]);
    await pool.query('INSERT INTO "GameAttempt" (id,"ownerKey","quizId","participantName",config,state,score,"completedAt") VALUES ($1,$2,$3,\'Best rival\',\'{}\',\'{}\',2000,NOW()),($4,$5,$3,\'Not finished\',\'{}\',\'{}\',99999,NULL),($6,$7,$8,\'Other quiz player\',\'{}\',\'{}\',99999,NOW())', [prefix+'replay', prefix+'34', quiz.id, prefix+'open', prefix+'open-owner', prefix+'other', prefix+'other-owner', otherQuiz.id]);
    const response = await page.request.get(`/api/quizzes/${quiz.id}/scoreboard`); expect(response.ok()).toBe(true);
    const board: QuizScoreboard = await response.json();
    expect(board.total).toBe(35); expect(board.entries).toHaveLength(30); expect(board.nextPage).toBe(1);
    expect(board.entries[0]).toEqual({ rank: 1, name: "Board Explorer", avatar: "fox", score: 9999, level: 7, isYou: true });
    expect(board.entries[1]).toMatchObject({ rank: 2, name: "Best rival", score: 2000, level: 35 });
    for (const row of board.entries) expect(Object.keys(row).sort()).toEqual(["avatar", "isYou", "level", "name", "rank", "score"]);
    const publicResponse = await visitor.get(`/api/quizzes/${quiz.id}/scoreboard`);
    expect(publicResponse.ok()).toBe(true);
    const publicBoard: QuizScoreboard = await publicResponse.json();
    expect(publicBoard.total).toBe(35); expect(publicBoard.entries.every((entry) => !entry.isYou)).toBe(true);
    const later: QuizScoreboard = await (await page.request.get(`/api/quizzes/${quiz.id}/scoreboard?page=1`)).json();
    expect(later.entries).toHaveLength(5); expect(later.entries[0].rank).toBe(31); expect(later.nextPage).toBeNull();
    expect((await page.request.get(`/api/quizzes/${quiz.id}/scoreboard?page=-1`)).status()).toBe(400);
    await page.goto(`/results/${round.id}`);
    await expect(page.getByRole("region", { name: "Quiz scoreboard", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open quiz scoreboard", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Quiz scoreboard", exact: true }); await expect(dialog).toBeVisible();
    await expect(dialog.locator("li")).toHaveCount(30);
    await expect(dialog.locator(".scoreboard-you").getByText("Level 7", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "More explorers", exact: true }).click(); await expect(dialog.locator("li")).toHaveCount(35);
    await dialog.getByRole("button", { name: "Refresh scoreboard", exact: true }).click(); await expect(dialog.locator("li")).toHaveCount(30);
    await dialog.locator("li").first().scrollIntoViewIfNeeded();
    if (process.env.CAPTURE_QUIZ_PREVIEW === "1") await page.screenshot({ path: "/tmp/mindquest-scoreboard.png" });
    await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open quiz scoreboard", exact: true })).toBeFocused();
    for (const width of [320,390,768,1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByRole("button", { name: "Open quiz scoreboard", exact: true })).toBeInViewport();
    }
    await page.request.patch(`/api/quizzes/${quiz.id}`, { data: { published: false } });
    expect((await page.request.get(`/api/quizzes/${quiz.id}/scoreboard`)).status()).toBe(404);
  } finally {
    if (creatorId) await pool.query('DELETE FROM "User" WHERE id=$1', [creatorId]);
    await pool.query('DELETE FROM "PlayerProfile" WHERE "ownerKey" LIKE $1', [prefix+'%']);
    if (viewer) await pool.query('DELETE FROM "PlayerProfile" WHERE "ownerKey"=$1', [viewer]);
    await visitor.dispose();
    await pool.end();
  }
});
