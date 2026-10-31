import { test, expect } from "@playwright/test";
test("visitor can explore Arena settings and the guide", async ({ page }) => {
  await page.goto("/");
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
