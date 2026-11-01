import { test, expect } from "@playwright/test";
import { config } from "dotenv";
import { Pool } from "pg";
config({ path: "apps/web/.env", quiet: true });
test.use({ extraHTTPHeaders: { "x-forwarded-for": "192.0.2.99" } });

test("home, library, adventure, creator dashboard and studio show loaders while their data is pending", async ({ page }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs a disposable migrated and seeded database.");
  test.setTimeout(60000);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let creatorId: string | undefined;
  try {
    const account = await page.request.post("/api/auth/sign-up/email", { data: { name: "Loader Creator", email: `loader-${Date.now()}@example.com`, password: "Test-password-42!" }, headers: { Origin: "http://localhost:3000" } });
    expect(account.ok()).toBe(true); creatorId = (await account.json()).user.id;
    const cases = [
      { path: "/", api: "**/api/quizzes/public", label: "Opening the quest library…" },
      { path: "/library", api: "**/api/quizzes/public", label: "Opening the quest library…" },
      { path: "/me", api: "**/api/player/history", label: "Opening your adventure book…" },
      { path: "/dashboard", api: "**/api/creator/overview", label: "Opening your quizzes…" },
      { path: "/create", api: "**/api/quizzes", label: "Opening your quizzes…" },
    ];
    for (const item of cases) {
      let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve; });
      await page.route(item.api, async (route) => { await gate; await route.continue(); });
      try {
        await page.goto(item.path);
        const loader = page.locator(".quest-loader").filter({ hasText: item.label });
        await expect(loader).toBeVisible();
        await expect(loader).toHaveAttribute("role", "status");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(loader.locator(".quest-loader-buddy")).toHaveCSS("animation-name", "none");
        release();
        await expect(loader).toHaveCount(0, { timeout: 15000 });
      } finally { release(); await page.unroute(item.api); }
    }
    await page.goto("/");
    await expect(page.locator(".quest-card-grid")).toHaveCount(1);
    await page.getByRole("link", { name: "Explore free quizzes", exact: true }).click();
    await expect(page).toHaveURL(/\/#quest-library$/);
    await expect(page.getByRole("textbox", { name: "Search quizzes" })).toBeInViewport();
    if (process.env.CAPTURE_QUIZ_PREVIEW === "1") await page.screenshot({ path: "/tmp/mindquest-home-restored.png" });
  } finally {
    if (creatorId) await pool.query('DELETE FROM "User" WHERE id=$1', [creatorId]);
    await pool.end();
  }
});

test("failed library requests stop the loader and show a retry action", async ({ page }) => {
  await page.route("**/api/quizzes/public", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "The library is temporarily unavailable." }) }));
  await page.goto("/library");
  await expect(page.locator(".quest-library").getByRole("alert")).toContainText("The library is temporarily unavailable.");
  await expect(page.locator(".quest-library .quest-loader")).toHaveCount(0);
  await expect(page.locator(".quest-library").getByRole("alert").getByRole("button")).toBeVisible();
});


test("saved result errors stop the purple loader and retry shows it until the next response", async ({ page }) => {
  let retry = false; let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/arena/unavailable-result", async (route) => {
    if (retry) await gate;
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: retry ? "Try again in a moment." : "The result is temporarily unavailable." }) });
  });
  try {
    await page.goto("/results/unavailable-result");
    const alert = page.locator(".arena-alert");
    await expect(alert).toContainText("The result is temporarily unavailable.");
    await expect(page.locator(".quest-loader")).toHaveCount(0);
    retry = true;
    await alert.getByRole("button").click();
    await expect(page.locator(".quest-loader-dark")).toContainText("Opening your saved result…");
    release();
    await expect(alert).toContainText("Try again in a moment.");
    await expect(page.locator(".quest-loader")).toHaveCount(0);
  } finally { release(); }
});
