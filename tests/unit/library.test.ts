import catalogue from "../../apps/server/prisma/seeds/catalogue.json";
import { isMastery, rewardTarget, playerLevel, avatarsForLevel, availableAvatars, avatarUnlockLevel } from "@mindquest/server/quizzes/reward-rules";
import { quizSchema } from "@mindquest/server/quizzes/validation";
test("50 complete, unique ready quizzes cover ten topics and 750 distinct questions", () => {
  expect(catalogue).toHaveLength(50); expect(new Set(catalogue.map((q) => q.title)).size).toBe(50);
  expect(new Set(catalogue.map((q) => q.code)).size).toBe(50); expect(new Set(catalogue.map((q) => q.topic)).size).toBe(10);
  const prompts = catalogue.flatMap((q) => q.questions.map((question) => question.prompt));
  expect(prompts).toHaveLength(750); expect(new Set(prompts).size).toBe(750);
  for (const quiz of catalogue) {
    expect(quiz.questions).toHaveLength(15);
    expect(quiz.code).toMatch(/^[A-Z2-9]{8}$/);
    expect(quizSchema.safeParse({ title: quiz.title, timed: false, questions: quiz.questions }).success).toBe(true);
    for (const question of quiz.questions) expect(question.explanation.length).toBeGreaterThan(15);
  }
});
test("mastery means strictly more than 90 percent", () => {
  expect(isMastery(9, 10)).toBe(false); expect(isMastery(14, 15)).toBe(true); expect(isMastery(13, 15)).toBe(false); expect(isMastery(0, 0)).toBe(false);
});
test("new-best rewards grant only the difference and mastery bonus once", () => {
  const first = rewardTarget(13, 15); const improved = rewardTarget(14, 15);
  expect(first).toEqual({ xp: 130, coins: 26, mastered: false });
  expect(improved).toEqual({ xp: 240, coins: 78, mastered: true });
  expect(improved.xp - first.xp).toBe(110); expect(improved.coins - first.coins).toBe(52);
  expect(rewardTarget(14, 15).xp - improved.xp).toBe(0);
  expect(playerLevel(299)).toBe(1); expect(playerLevel(300)).toBe(2); expect(playerLevel(600)).toBe(3);
});
test("English distractors are topic-specific and authored correct positions vary", () => {
  const repeatedFillers = ["opposite", "purple", "colourful", "ordinary", "a type of weather forecast", "the name of a planet", "text-paint", "horizontal-size-name"];
  const questions = catalogue.flatMap((quiz) => quiz.questions);
  expect(new Set(questions.map((q) => q.correctIndex)).size).toBe(4);
  for (const quiz of catalogue.filter((q) => q.topic === "English")) {
    for (const question of quiz.questions) expect(question.options.some((option) => repeatedFillers.includes(option))).toBe(false);
  }
});

test("five free avatars and ten level unlocks are independent of trophy scores", () => {
  expect(availableAvatars(1)).toHaveLength(5);
  expect(avatarsForLevel(1)).toEqual([]);
  expect(avatarsForLevel(2)).toEqual(["phoenix"]);
  expect(availableAvatars(3)).toHaveLength(7);
  expect(availableAvatars(11)).toHaveLength(15);
  expect(availableAvatars(90)).toHaveLength(15);
  expect(avatarUnlockLevel("panda")).toBe(11);
  expect(availableAvatars(1, ["rocket"])).toContain("rocket");
  expect(isMastery(90, 100)).toBe(false);
  expect(isMastery(91, 100)).toBe(true);
});
