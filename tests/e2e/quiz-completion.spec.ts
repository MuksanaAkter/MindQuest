import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";
import type { ArenaView } from "@mindquest/server/arena/contracts";
config({ path: "apps/web/.env", quiet: true });
test.use({ extraHTTPHeaders: { "x-forwarded-for": "192.0.2.88" } });

test("submit freezes the timer, last answer opens results and scoreboard automatically, and saved results have their own URL", async ({ page }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs a disposable migrated database.");
  test.setTimeout(60000);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let creatorId: string | undefined; let ownerKey: string | undefined;
  let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve; });
  try {
    const signup = await page.request.post("/api/auth/sign-up/email", { data: { name: "Finish Creator", email: `finish-${Date.now()}@example.com`, password: "Test-password-42!" }, headers: { Origin: "http://localhost:3000" } });
    expect(signup.ok()).toBe(true); creatorId = (await signup.json()).user.id;
    const created = await page.request.post("/api/quizzes", { data: { title: "A tiny adventure", timed: true, questions: [{ prompt: "What is one plus one?", options: ["2", "3", "4", "5"], correctIndex: 0, explanation: "One and one make two." }, { prompt: "What is two plus one?", options: ["3", "4", "5", "6"], correctIndex: 0, explanation: "Two and one make three." }] } });
    expect(created.ok()).toBe(true); const quiz = await created.json();
    const joined = await page.request.post("/api/quizzes/join", { data: { code: quiz.code, name: "Happy Explorer", avatar: "fox" } });
    const round: ArenaView = (await joined.json()).attempt;
    ownerKey = `guest:${(await page.context().cookies()).find((cookie) => cookie.name === "mq_guest")!.value}`;
    await page.goto(`/play/${round.id}`);
    await page.getByRole("button", { name: /^[ABCD] 2$/ }).click();
    await page.route(`**/api/arena/${round.id}`, async (route) => {
      if (route.request().method() === "POST" && route.request().postDataJSON().questionId === round.question!.id) await gate;
      await route.continue();
    });
    await page.getByRole("button", { name: "Lock in answer", exact: true }).click();
    await expect(page.getByRole("timer")).toHaveClass(/is-paused/);
    const frozen = await page.getByRole("timer").getAttribute("aria-label");
    await page.waitForTimeout(1300);
    await expect(page.getByRole("timer")).toHaveAttribute("aria-label", frozen!);
    release();
    await expect(page.getByRole("heading", { name: "A brilliant discovery!" })).toBeVisible();
    await page.getByRole("button", { name: "Next discovery", exact: true }).click();
    await page.getByRole("button", { name: /^[ABCD] 3$/ }).click();
    // The handler receives the answer before its deadline. A DB row lock then
    // delays processing past the deadline; the saved request arrival time wins.
    const lock = await pool.connect();
    let response: import("@playwright/test").Response | undefined;
    let committed = false;
    try {
      await lock.query("BEGIN");
      await lock.query('UPDATE "GameAttempt" SET state=jsonb_set(state,\'{questionStartedAt}\',to_jsonb($2::text)) WHERE id=$1', [round.id, new Date(Date.now() - 14000).toISOString()]);
      const finished = page.waitForResponse((reply) => reply.url().endsWith(`/api/arena/${round.id}`) && reply.request().method() === "POST");
      await page.getByRole("button", { name: "Lock in answer", exact: true }).click();
      await page.waitForTimeout(1500);
      await lock.query("COMMIT"); committed = true;
      response = await finished;
    } finally { if (!committed) await lock.query("ROLLBACK"); lock.release(); }
    expect(response!.ok()).toBe(true);
    const final: ArenaView = await response!.json(); expect(final.phase).toBe("results"); expect(final.correctCount).toBe(2);
    const popup = page.getByRole("dialog", { name: "Adventure complete!", exact: true });
    await expect(popup).toBeVisible(); await expect(popup.getByText("2/2", { exact: true })).toBeVisible();
    await expect(popup.locator(".scoreboard-you .scoreboard-player strong")).toContainText("Happy Explorer");
    await expect(page.getByRole("button", { name: "Reveal my results", exact: true })).toHaveCount(0);
    if (process.env.CAPTURE_QUIZ_PREVIEW === "1") await page.screenshot({ path: "/tmp/mindquest-auto-results.png" });
    let showResult!: () => void; const resultGate = new Promise<void>((resolve) => { showResult = resolve; });
    await page.route(`**/api/arena/${round.id}`, async (route) => { if (route.request().method() === "GET") await resultGate; await route.continue(); });
    try {
      await popup.getByRole("link", { name: "View full result", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/results/${round.id}$`));
      const loader = page.locator(".arena-pending .quest-loader");
      await expect(loader).toContainText("Opening your saved result…");
      await expect(loader).toHaveClass(/quest-loader-dark/);
      await expect(loader.locator("strong")).toHaveCSS("color", "rgb(234, 217, 251)");
      await expect(page.locator(".arena-shell")).toHaveClass(/quiz-results/);
      await expect(page.locator(".arena-shell")).not.toHaveClass(/quiz-viewport/);
      await expect(loader).toBeInViewport();
      if (process.env.CAPTURE_QUIZ_PREVIEW === "1") await page.screenshot({ path: "/tmp/mindquest-result-loader-fixed.png" });
    } finally { showResult(); }
    await expect(page.getByRole("group", { name: "Your quiz score" })).toContainText("2/2");
    await expect(page.locator(".arena-pending")).toHaveCount(0);
    await page.reload(); await expect(page.getByRole("group", { name: "Your quiz score" })).toContainText("2/2");
    expect((await pool.query('SELECT count(*)::int AS count FROM "PlayerQuizProgress" WHERE "ownerKey"=$1 AND "quizId"=$2', [ownerKey, quiz.id])).rows[0].count).toBe(1);
    await page.getByRole("link", { name: "My adventure", exact: true }).first().click();
    await expect(page).toHaveURL(/\/me$/);
    await page.getByRole("link", { name: "See my result", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Go back", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await expect(page).toHaveURL(/\/me$/);
    const direct = await page.context().newPage();
    try {
      await direct.goto(`/results/${round.id}`);
      await direct.getByRole("button", { name: "Go back", exact: true }).click();
      await expect(direct).toHaveURL(/\/library$/);
    } finally { await direct.close(); }

  } finally {
    release();
    if (creatorId) await pool.query('DELETE FROM "User" WHERE id=$1', [creatorId]);
    if (ownerKey) await pool.query('DELETE FROM "PlayerProfile" WHERE "ownerKey"=$1', [ownerKey]);
    await pool.end();
  }
});

test("quiz library navigation opens its own page and old shared codes still arrive there", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Little questions.");
  await expect(page.locator(".quest-card-grid")).toHaveCount(1);
  await page.getByRole("link", { name: "Quiz library", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("heading", { name: "Quiz library", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Search quizzes" })).toBeVisible();
  for (const width of [320,390,1280]) { await page.setViewportSize({ width, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  await page.goto("/?code=MQLIBAAA#join-quiz");
  await expect(page).toHaveURL(/\/library\?code=MQLIBAAA#join-quiz$/);
  await expect(page.getByLabel("Quiz code", { exact: true })).toHaveValue("MQLIBAAA");
});
