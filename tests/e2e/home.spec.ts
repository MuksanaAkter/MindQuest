import { test, expect } from "@playwright/test";
test("visitor can try a quest and navigate to signup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("extraordinary");
  await page.getByRole("button", { name: /Read a few pages/ }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
  await page.getByRole("link", { name: "Begin your journey" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your adventure starts here.");
});
test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: "ok", service: "mindquest" });
});
