import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";
import { config } from "dotenv";
config({ path: "apps/web/.env", quiet: true });

async function actionsFit(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  await expect(button).toBeVisible();
  const dimensions = await button.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: innerHeight, pageHeight: document.documentElement.scrollHeight, pageWidth: document.documentElement.scrollWidth, width: innerWidth, scrollY };
  });
  expect(dimensions.top).toBeGreaterThanOrEqual(0);
  expect(dimensions.bottom).toBeLessThanOrEqual(dimensions.height);
  expect(dimensions.pageHeight).toBeLessThanOrEqual(dimensions.height + 1);
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.width);
  expect(dimensions.scrollY).toBe(0);
}

test("quiz actions stay in the viewport with long questions and explanations on phones, tablets and laptops", async ({ page }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs a disposable migrated database.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let creatorId: string | undefined; let ownerKey: string | undefined;
  const sizes = [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 844, height: 390 }];
  try {
    const signup = await page.request.post("/api/auth/sign-up/email", { data: { name: "Viewport Creator", email: `viewport-${Date.now()}@example.com`, password: "Test-password-42!" }, headers: { Origin: "http://localhost:3000" } });
    expect(signup.ok()).toBe(true); creatorId = (await signup.json()).user.id;
    const created = await page.request.post("/api/quizzes", { data: { title: "A lovely long question adventure", timed: false, questions: [{ prompt: "Which answer is kind? " + "Think about the words you would use with a new friend. ".repeat(8), options: ["answer zero", "answer one", "answer two", "answer three"].map((label) => `${label}: ${"A friendly story with lots of words. ".repeat(5)}`), correctIndex: 0, explanation: "A kind word makes someone feel welcome. ".repeat(25) }] } });
    expect(created.ok()).toBe(true); const quiz = await created.json();
    const joined = await page.request.post("/api/quizzes/join", { data: { code: quiz.code, name: "Viewport Explorer", avatar: "owl" } });
    expect(joined.ok()).toBe(true); const { attempt } = await joined.json();
    const guest = (await page.context().cookies()).find((cookie) => cookie.name === "mq_guest")!; ownerKey = `guest:${guest.value}`;
    await page.goto(`/play/${attempt.id}`);
    await expect(page.getByRole("group", { name: "Answer choices" })).toBeVisible();
    for (const size of sizes) { await page.setViewportSize(size); await actionsFit(page, "Lock in answer"); }
    await page.getByRole("button", { name: /answer zero:/ }).click();
    await page.getByRole("button", { name: "Lock in answer", exact: true }).click();
    await expect(page.getByRole("heading", { name: "A brilliant discovery!" })).toBeVisible();
    for (const size of sizes) { await page.setViewportSize(size); await actionsFit(page, "Reveal my results"); }
    await page.setViewportSize({ width: 390, height: 844 });
    if (process.env.CAPTURE_QUIZ_PREVIEW === "1") await page.screenshot({ path: "/tmp/mindquest-compact-mobile.png" });
  } finally {
    if (ownerKey) { await pool.query('DELETE FROM "GameAttempt" WHERE "ownerKey"=$1', [ownerKey]); await pool.query('DELETE FROM "PlayerProfile" WHERE "ownerKey"=$1', [ownerKey]); }
    if (creatorId) await pool.query('DELETE FROM "User" WHERE id=$1', [creatorId]);
    await pool.end();
  }
});
