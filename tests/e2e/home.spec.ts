import { test, expect } from "@playwright/test";
test("visitor can explore Arena settings and the guide", async ({ page }) => {
  await page.goto("/arena");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Knowledge Arena");
  await page.getByRole("button", { name: "Enter the arena" }).click();
  await page.getByRole("button", { name: /Science & nature/ }).click();
  await expect(page.getByRole("button", { name: /Science & nature/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("switch", { name: "Race the hourglass" }).click();
  await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "The adventurer’s guide", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Got it. Let’s explore." }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: "ok", service: "mindquest" });
});


test("public landing leads to matching auth pages and guest Arena", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Little questions.");
  await page.getByRole("link", { name: "Creator login", exact: true }).first().click();
  await page.getByRole("link", { name: "Create an account", exact: true }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your adventure starts here.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByLabel("Password", { exact: true }).fill("Example-password-42!");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("link", { name: "Creator login", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back, explorer.");
  await page.getByRole("link", { name: "Join a quiz without an account", exact: true }).click();
  await expect(page).toHaveURL(/\/#join-quiz$/);
  await expect(page.getByRole("heading", { name: "Ready to play?" })).toBeVisible();
});

test("hero animation can be paused and player adventure is outside creator dashboard", async ({ page }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs the local database and creator auth environment.");
  await page.goto("/");
  const video = page.getByTestId("hero-video");
  await expect(video).toHaveJSProperty("muted", true);
  await expect(video).toHaveJSProperty("loop", true);
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(.1);
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  await expect(video).toHaveJSProperty("paused", true);
  await expect(page.getByRole("button", { name: "Play animation", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Play animation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause animation", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(video).toHaveJSProperty("paused", false);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("link", { name: "My adventure", exact: true }).first().click();
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Look how far you’ve come");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});


test("reduced motion shows a poster without requesting hero video", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const videoRequests: string[] = [];
  page.on("request", request => { if (/\.(mp4|webm)(?:\?|$)/.test(request.url())) videoRequests.push(request.url()); });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Still image", exact: true })).toBeDisabled();
  await expect(page.getByTestId("hero-video")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Little questions.");
  expect(videoRequests).toHaveLength(0);
});

test("mobile hero uses the lightweight video and retains readable content", async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  const video = page.getByTestId("hero-video");
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentSrc)).toContain("mindquest-kingdom-mobile.mp4");
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(.1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});


test("failed hero video keeps a readable poster and usable navigation", async ({ page }) => {
  await page.route(/\.(mp4|webm)(?:\?|$)/, route => route.abort());
  const finalSource = page.waitForRequest("**/mindquest-kingdom.webm");
  await page.goto("/");
  await finalSource;
  await expect(page.getByRole("button", { name: "Still image", exact: true })).toBeDisabled();
  await expect(page.getByTestId("hero-video")).toHaveCount(0);
  await expect(page.getByRole("img", { name: "A friendly purple owl and orange fox exploring an enchanted floating castle" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore free quizzes", exact: true })).toBeVisible();
});
