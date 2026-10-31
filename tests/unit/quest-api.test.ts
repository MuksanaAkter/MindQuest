import { getSession } from "@mindquest/server/session";
import { getDb } from "@mindquest/server/db";
import { POST as createQuest } from "@mindquest/server/quests";
import { POST as completeQuest } from "@mindquest/server/complete-quest";

jest.mock("@mindquest/server/session", () => ({ getSession: jest.fn() }));
jest.mock("@mindquest/server/db", () => ({ getDb: jest.fn() }));
const sessionMock = jest.mocked(getSession);
const dbMock = jest.mocked(getDb);
const request = () => new Request("http://localhost:3000/api/quests/q1/complete", { method: "POST" });
const context = { params: Promise.resolve({ id: "q1" }) };

beforeEach(() => jest.resetAllMocks());

test("unauthenticated users cannot complete quests", async () => {
  sessionMock.mockResolvedValue(null);
  expect((await completeQuest(request(), context)).status).toBe(401);
  expect(dbMock).not.toHaveBeenCalled();
});

function setupTransaction(quest: { difficulty: "EASY" } | null, updated: number) {
  sessionMock.mockResolvedValue({ user: { id: "owner" } } as Awaited<ReturnType<typeof getSession>>);
  const tx = {
    quest: { findFirst: jest.fn().mockResolvedValue(quest), updateMany: jest.fn().mockResolvedValue({ count: updated }) },
    progress: { upsert: jest.fn() },
  };
  dbMock.mockReturnValue({ $transaction: (fn: (client: typeof tx) => Promise<unknown>) => fn(tx) } as unknown as ReturnType<typeof getDb>);
  return tx;
}

test("completion is scoped to the session owner", async () => {
  const tx = setupTransaction(null, 0);
  expect((await completeQuest(request(), context)).status).toBe(404);
  expect(tx.quest.findFirst).toHaveBeenCalledWith({ where: { id: "q1", userId: "owner" } });
  expect(tx.progress.upsert).not.toHaveBeenCalled();
});

test("an already completed quest cannot award more XP", async () => {
  const tx = setupTransaction({ difficulty: "EASY" }, 0);
  const response = await completeQuest(request(), context);
  expect(await response.json()).toEqual({ awardedXp: 0 });
  expect(tx.progress.upsert).not.toHaveBeenCalled();
});

test("completion condition and XP update use the same transaction", async () => {
  const tx = setupTransaction({ difficulty: "EASY" }, 1);
  const response = await completeQuest(request(), context);
  expect(await response.json()).toEqual({ awardedXp: 20 });
  expect(tx.quest.updateMany).toHaveBeenCalledWith({ where: { id: "q1", userId: "owner", completedAt: null }, data: { completedAt: expect.any(Date) } });
  expect(tx.progress.upsert).toHaveBeenCalledWith({ where: { userId: "owner" }, create: { userId: "owner", totalXp: 20 }, update: { totalXp: { increment: 20 } } });
});

test("invalid JSON is rejected without creating a quest", async () => {
  sessionMock.mockResolvedValue({ user: { id: "owner" } } as Awaited<ReturnType<typeof getSession>>);
  const response = await createQuest(new Request("http://localhost:3000/api/quests", { method: "POST", body: "{" }));
  expect(response.status).toBe(400);
  expect(dbMock).not.toHaveBeenCalled();
});
