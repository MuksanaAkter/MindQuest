export const XP_PER_LEVEL = 100;
export const QUEST_XP = { EASY: 20, MEDIUM: 40, HARD: 60 } as const;
export function getLevel(totalXp: number) {
  return Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL) + 1;
}
export function getLevelProgress(totalXp: number) {
  return Math.max(0, totalXp) % XP_PER_LEVEL;
}
