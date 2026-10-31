import type { Difficulty } from "./contracts";
export const ROUND_LENGTH = 5;
export const QUESTION_SECONDS = { EASY: 15, MEDIUM: 15, HARD: 15 } as const;
export function answerPoints(correct: boolean, streak: number, difficulty: Difficulty): number {
  if (!correct) return 0;
  const base = { EASY: 100, MEDIUM: 150, HARD: 200 }[difficulty];
  return base + Math.min(Math.max(streak - 1, 0), 4) * 25;
}
export function roundXp(correctCount: number, difficulty: Difficulty): number {
  return correctCount * { EASY: 10, MEDIUM: 15, HARD: 20 }[difficulty] + (correctCount === ROUND_LENGTH ? 25 : 0);
}
export function resultRank(correctCount: number): string {
  if (correctCount === ROUND_LENGTH) return "Arena legend";
  if (correctCount >= 4) return "Royal scholar";
  if (correctCount >= 3) return "Rising explorer";
  return "Curious adventurer";
}
