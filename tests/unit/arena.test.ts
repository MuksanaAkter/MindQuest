jest.mock("server-only", () => ({}));
import { answerPoints, roundXp, resultRank, ROUND_LENGTH } from "../../apps/server/src/games/shared/scoring";
import { QUESTIONS } from "../../apps/server/src/games/knowledge/questions";
import { seededRandom, selectQuestions, shuffled } from "../../apps/server/src/games/knowledge/selection";
import type { ArenaConfig } from "@mindquest/server/arena/contracts";
const config: ArenaConfig = { category: "mixed", difficulty: "EASY", timed: false, daily: false };
test("incorrect and expired answers never earn points", () => { expect(answerPoints(false, 5, "HARD")).toBe(0); });
test("streak bonus caps at 100 points and restarts at the base", () => {
  expect(answerPoints(true, 1, "EASY")).toBe(100);
  expect(answerPoints(true, 2, "EASY")).toBe(125);
  expect(answerPoints(true, 20, "HARD")).toBe(300);
});
test("perfect XP bonus is awarded only for a complete perfect round", () => {
  expect(roundXp(4, "EASY")).toBe(40); expect(roundXp(5, "EASY")).toBe(75);
  expect(roundXp(5, "HARD")).toBe(125); expect(roundXp(0, "MEDIUM")).toBe(0);
});
test("ranks reflect learning outcomes", () => { expect(resultRank(5)).toBe("Arena legend"); expect(resultRank(0)).toBe("Curious adventurer"); });
test("every category and difficulty has enough unique, valid questions", () => {
  expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  for (const category of ["science", "world", "history"] as const) {
    for (const difficulty of ["EASY", "MEDIUM", "HARD"] as const) {
      const round = selectQuestions({ ...config, category, difficulty }, "test");
      expect(round).toHaveLength(ROUND_LENGTH);
      expect(round.every((q) => q.category === category && q.difficulty === difficulty)).toBe(true);
    }
  }
  for (const q of QUESTIONS) { expect(q.options).toHaveLength(4); expect(new Set(q.options).size).toBe(4); expect(q.explanation.length).toBeGreaterThan(30); }
});
test("daily selections are deterministic, and practice seeds vary", () => {
  expect(selectQuestions(config, "2026-10-31")).toEqual(selectQuestions(config, "2026-10-31"));
  expect(selectQuestions(config, "one").map((q) => q.id)).not.toEqual(selectQuestions(config, "two").map((q) => q.id));
});
test("shuffle preserves values without mutating its input", () => {
  const input = [1, 2, 3, 4]; const result = shuffled(input, seededRandom("a"));
  expect(input).toEqual([1, 2, 3, 4]); expect([...result].sort()).toEqual(input);
});
