import { test, expect } from "@playwright/test";
import type { ArenaView, ArenaOverview } from "@mindquest/server/arena/contracts";
const config = { category: "science", difficulty: "EASY", timed: false, daily: false };
test("guest can play, reload, resume, review, and replay", async ({ page }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs a migrated PostgreSQL database.");
  await page.goto("/arena");
  await page.getByRole("button", { name: /Science & nature/ }).click();
  await page.getByRole("button", { name: "Begin expedition" }).click();
  await expect(page.getByRole("group", { name: "Answer choices" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lock in answer" })).toBeDisabled();
  await page.keyboard.press("1");
  await page.getByRole("button", { name: "Lock in answer" }).click();
  await expect(page.getByText("THE STORY BEHIND THE ANSWER")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("THE STORY BEHIND THE ANSWER")).toBeVisible();
  await page.getByRole("button", { name: "Next discovery" }).click();
  for (let i = 1; i < 5; i++) {
    await page.getByRole("group", { name: "Answer choices" }).getByRole("button").first().click();
    await page.getByRole("button", { name: "Lock in answer" }).click();
    await page.getByRole("button", { name: i === 4 ? "Reveal my results" : "Next discovery" }).click();
  }
  await expect(page.getByRole("heading", { name: "Your discoveries" })).toBeVisible();
  await expect(page.getByText("Practice round saved.", { exact: false })).toBeVisible();
  await expect(page.locator("details")).toHaveCount(5);
  await page.getByRole("button", { name: "Play another round" }).click();
  await expect(page.getByRole("group", { name: "Answer choices" })).toBeVisible();
});
test("API enforces ownership, hides answers, rejects tampering, and deduplicates submissions", async ({ request, playwright }) => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Needs a migrated PostgreSQL database.");
  await request.get("/api/arena");
  const started = await request.post("/api/arena", { data: config });
  expect(started.ok()).toBeTruthy();
  const round: ArenaView = await started.json();
  expect(round.question).not.toHaveProperty("answer"); expect(round.question).not.toHaveProperty("explanation");
  expect(round.reviews).toHaveLength(0);
  const outsider = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
  try {
    expect((await outsider.get(`/api/arena/${round.id}`)).status()).toBe(404);
    expect((await request.post(`/api/arena/${round.id}`, { data: { action: "answer", questionId: round.question!.id, choiceId: round.question!.options[0].id, score: 999 } })).status()).toBe(400);
    expect((await request.post(`/api/arena/${round.id}`, { data: { action: "answer", questionId: round.question!.id, choiceId: null } })).status()).toBe(400);
    const data = { action: "answer", questionId: round.question!.id, choiceId: round.question!.options[0].id };
    const responses = await Promise.all([request.post(`/api/arena/${round.id}`, { data }), request.post(`/api/arena/${round.id}`, { data })]);
    const views: ArenaView[] = await Promise.all(responses.map((r) => r.json()));
    expect(views[0].score).toBe(views[1].score); expect(views[0].reviews).toHaveLength(1); expect(views[1].reviews).toHaveLength(1);
    const moved = await request.post(`/api/arena/${round.id}`, { data: { action: "next", questionId: round.question!.id } });
    const next: ArenaView = await moved.json(); expect(next.index).toBe(1);
    expect((await request.post(`/api/arena/${round.id}`, { data })).status()).toBe(409);
    const overview: ArenaOverview = await (await request.get("/api/arena")).json(); expect(overview.activeId).toBe(round.id);
  } finally { await outsider.dispose(); }
});
