import "server-only";
import type { Prisma } from "../generated/prisma/client";
import { getDb } from "../db";
import {  type Avatar, type PlayerState, type PlayerRewardSummary } from "./contracts";
import { playerLevel, PLAYER_XP_PER_LEVEL, rewardTarget, rewardBadge, availableAvatars, avatarsForLevel } from "./reward-rules";
export async function getPlayer(ownerKey: string): Promise<PlayerState> {
  const db = getDb();
  const profile = await db.playerProfile.upsert({ where: { ownerKey }, create: { ownerKey }, update: {} });
  const progress = await db.playerQuizProgress.findMany({ where: { ownerKey }, include: { quiz: { select: { questions: true, title: true, icon: true } } } });
  const unlockedAvatars = availableAvatars(playerLevel(profile.totalXp), profile.unlockedAvatars);
  return { trophies: progress.filter((p) => p.mastered).map((p) => ({ quizId: p.quizId, title: p.quiz.title, icon: p.quiz.icon, accuracy: Math.round(p.bestCorrect / (p.quiz.questions as unknown[]).length * 100) })), name: profile.name, avatar: unlockedAvatars.includes(profile.avatar as Avatar) ? profile.avatar as Avatar : "owl", totalXp: profile.totalXp, coins: profile.coins, level: playerLevel(profile.totalXp), xpInLevel: profile.totalXp % PLAYER_XP_PER_LEVEL, unlockedAvatars, completedQuizzes: progress.length, masteredQuizzes: progress.filter((p) => p.mastered).length, bestByQuiz: Object.fromEntries(progress.map((p) => [p.quizId, Math.round(p.bestCorrect / (p.quiz.questions as unknown[]).length * 100)])) };
}
export async function grantLibraryReward(tx: Prisma.TransactionClient, ownerKey: string, quizId: string, correct: number, total: number): Promise<PlayerRewardSummary> {
  // Serialize all rewards for a browser, including different simultaneous quiz attempts.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerKey}))::text`;
  const player = await tx.playerProfile.upsert({ where: { ownerKey }, create: { ownerKey }, update: {} });
  const previous = await tx.playerQuizProgress.findUnique({ where: { ownerKey_quizId: { ownerKey, quizId } } });
  const bestCorrect = Math.max(correct, previous?.bestCorrect ?? 0);
  const target = rewardTarget(bestCorrect, total);
  const xp = target.xp - (previous?.xpEarned ?? 0); const coins = target.coins - (previous?.coinsEarned ?? 0);
  const newMastery = target.mastered && !previous?.mastered;
  const previousLevel = playerLevel(player.totalXp);
  const nextLevel = playerLevel(player.totalXp + xp);
  const before = availableAvatars(previousLevel, player.unlockedAvatars);
  const newlyUnlocked = availableAvatars(nextLevel, player.unlockedAvatars).filter((avatar) => !before.includes(avatar));
  const updated = await tx.playerProfile.update({ where: { ownerKey }, data: { totalXp: { increment: xp }, coins: { increment: coins }, unlockedAvatars: [...new Set([...player.unlockedAvatars, ...avatarsForLevel(nextLevel)])] } });
  await tx.playerQuizProgress.upsert({ where: { ownerKey_quizId: { ownerKey, quizId } }, create: { ownerKey, quizId, bestCorrect, xpEarned: target.xp, coinsEarned: target.coins, mastered: target.mastered }, update: { bestCorrect, xpEarned: target.xp, coinsEarned: target.coins, mastered: target.mastered } });
  return { trophy: target.mastered && correct * 100 > total * 90, newTrophy: newMastery, unlockedAvatars: newlyUnlocked, xp, coins, accuracy: Math.round(correct / total * 100), badge: rewardBadge(correct, total), unlockedAvatar: newlyUnlocked[0] ?? null, level: playerLevel(updated.totalXp), previousLevel: playerLevel(player.totalXp), totalXp: updated.totalXp, totalCoins: updated.coins, newBest: !previous || correct > previous.bestCorrect };
}
