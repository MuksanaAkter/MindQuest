import { getLevel, getLevelProgress, QUEST_XP } from "@mindquest/server/game";
import { questSchema } from "@mindquest/server/validation";
describe("level progression", () => {
  test.each([[0, 1, 0], [99, 1, 99], [100, 2, 0], [260, 3, 60], [-5, 1, 0]])("%i XP gives level %i with %i progress", (xp, level, progress) => {
    expect(getLevel(xp)).toBe(level); expect(getLevelProgress(xp)).toBe(progress);
  });
  it("awards increasing XP by difficulty", () => { expect(QUEST_XP.EASY).toBeLessThan(QUEST_XP.MEDIUM); expect(QUEST_XP.MEDIUM).toBeLessThan(QUEST_XP.HARD); });
});
describe("quest validation", () => {
  it("rejects blank titles and unknown difficulties", () => {
    expect(questSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(questSchema.safeParse({ title: "Read a book", difficulty: "IMPOSSIBLE" }).success).toBe(false);
  });
  it("trims input, defaults difficulty, and excludes client-supplied rewards and owners", () => {
    expect(questSchema.parse({ title: "  Read a book  ", userId: "another-user", xp: 999 })).toEqual({ title: "Read a book", description: "", difficulty: "EASY" });
  });
});
