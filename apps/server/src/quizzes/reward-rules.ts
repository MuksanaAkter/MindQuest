import { BASE_AVATARS, UNLOCKABLE_AVATARS, type Avatar } from "./contracts";
export const PLAYER_XP_PER_LEVEL = 300;
export function playerLevel(xp: number) { return Math.floor(Math.max(0, xp) / PLAYER_XP_PER_LEVEL) + 1; }
export function isMastery(correct: number, total: number) { return total > 0 && correct * 100 > total * 90; }
export function rewardTarget(correct: number, total: number) {
  const mastered = isMastery(correct, total);
  return { xp: correct * 10 + (mastered ? 100 : 0), coins: correct * 2 + (mastered ? 50 : 0), mastered };
}
export function rewardBadge(correct: number, total: number) {
  const ratio = total > 0 ? correct / total : 0;
  return isMastery(correct, total) ? "Royal mastery" : ratio >= .7 ? "Silver explorer" : ratio >= .4 ? "Bronze discovery" : "Curiosity spark";
}

export function avatarsForLevel(level: number): Avatar[] {
  return UNLOCKABLE_AVATARS.slice(0, Math.max(0, Math.min(10, Math.floor(level) - 1)));
}
export function availableAvatars(level: number, previouslyEarned: string[] = []): Avatar[] {
  return [...new Set<Avatar>([...BASE_AVATARS, ...avatarsForLevel(level), ...UNLOCKABLE_AVATARS.filter((avatar) => previouslyEarned.includes(avatar))])];
}
export function avatarUnlockLevel(avatar: string) {
  const index = UNLOCKABLE_AVATARS.findIndex((item) => item === avatar);
  return index < 0 ? 1 : index + 2;
}
