import { test, expect } from "@playwright/test";

// Isolate parallel test visitors from the production signup IP rate limit.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "192.0.2.12" } });
test("account owns its quests and completion awards XP once", async ({ page, playwright }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Requires a migrated disposable PostgreSQL database and auth environment.");
  const email = `explorer-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Test Explorer");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Test-password-42!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/quests");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Keep growing, Test Explorer.");
  const response = await page.request.post("/api/quests", { data: { title: "Read ten pages", difficulty: "EASY", userId: "forged-owner", xp: 9999 } });
  expect(response.status()).toBe(201);
  const { quest } = await response.json();
  const outsider = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
  try {
    expect((await outsider.post(`/api/quests/${quest.id}/complete`)).status()).toBe(401);
    const signup = await outsider.post("/api/auth/sign-up/email", { data: { email: `other-${email}`, name: "Other Explorer", password: "Test-password-42!" }, headers: { Origin: "http://localhost:3000" } });
    expect(signup.ok()).toBeTruthy();
    expect((await outsider.post(`/api/quests/${quest.id}/complete`)).status()).toBe(404);
    const completions = await Promise.all([page.request.post(`/api/quests/${quest.id}/complete`), page.request.post(`/api/quests/${quest.id}/complete`)]);
    expect(completions.every((r) => r.ok())).toBeTruthy();
    const awards = await Promise.all(completions.map(async (r) => (await r.json()).awardedXp));
    expect(awards.sort((a, b) => a - b)).toEqual([0, 20]);
    await page.reload();
    await expect(page.getByText("20 total XP", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Done", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back, explorer.");
    await page.goto("/quests");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Test-password-42!");
    await page.getByRole("button", { name: "Open creator dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Creator dashboard");
  } finally { await outsider.dispose(); }
});
