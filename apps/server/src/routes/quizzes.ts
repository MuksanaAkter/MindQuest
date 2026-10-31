import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { getSession } from "../session";
import { getDb } from "../db";
import { checkOrigin, guestIdentity, guarded } from "./arena";
import { ArenaError, publicView } from "../games/knowledge/service";
import { seededRandom, shuffled } from "../games/knowledge/selection";
import { quizSchema, joinSchema } from "../quizzes/validation";
import type { QuizInput, CreatorQuiz, PublicQuiz, Avatar } from "../quizzes/contracts";
import type { Prisma } from "../generated/prisma/client";
import { getPlayer } from "../quizzes/player";
import { BASE_AVATARS } from "../quizzes/contracts";
import { z } from "zod";
const json = (value: object) => value as unknown as Prisma.InputJsonValue;
async function creator() { const session = await getSession(); if (!session) throw new ArenaError(401, "Log in to create and manage quizzes."); return session.user.id; }
export async function LIST() { return guarded(async () => {
  const creatorId = await creator();
  const quizzes = await getDb().quiz.findMany({ where: { creatorId }, orderBy: { createdAt: "desc" }, take: 100, include: { attempts: { orderBy: { startedAt: "desc" }, take: 200, select: { id: true, participantName: true, participantAvatar: true, score: true, correctCount: true, completedAt: true } } } });
  return { quizzes: quizzes.map((q): CreatorQuiz => ({ id: q.id, title: q.title, code: q.code, timed: q.timed, builtIn: q.builtIn, topic: q.topic, icon: q.icon, description: q.description, difficultyLabel: q.difficultyLabel, questionCount: (q.questions as unknown as QuizInput["questions"]).length, published: q.published, participants: q.attempts.map((a) => ({ id: a.id, name: a.participantName ?? "Participant", avatar: (a.participantAvatar ?? "owl") as Avatar, score: a.score, correctCount: a.correctCount, completedAt: a.completedAt?.toISOString() ?? null })) })) };
}); }
export async function CREATE(request: Request) { return guarded(async () => {
  checkOrigin(request); const creatorId = await creator(); const input = quizSchema.parse(await request.json());
  if (await getDb().quiz.count({ where: { creatorId } }) >= 100) throw new ArenaError(429, "You can manage up to 100 quizzes.");
  const code = [...randomBytes(8)].map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  const quiz = await getDb().quiz.create({ data: { creatorId, title: input.title, timed: input.timed, questions: json(input.questions), code } });
  return { id: quiz.id, code: quiz.code, title: quiz.title };
}); }
export async function TOGGLE(request: Request, context: { params: Promise<{ id: string }> }) { return guarded(async () => {
  checkOrigin(request); const creatorId = await creator(); const { id } = await context.params;
  const { published } = z.object({ published: z.boolean() }).strict().parse(await request.json());
  const changed = await getDb().quiz.updateMany({ where: { id, creatorId }, data: { published } });
  if (!changed.count) throw new ArenaError(404, "Quiz not found."); return { published };
}); }
export async function PUBLIC() { return guarded(async () => {
  const quizzes = await getDb().quiz.findMany({ where: { published: true }, orderBy: [{ builtIn: "desc" }, { createdAt: "desc" }, { seedKey: "asc" }, { id: "asc" }], take: 150, select: { id: true, title: true, code: true, timed: true, questions: true, builtIn: true, topic: true, icon: true, description: true, difficultyLabel: true } });
  return { quizzes: quizzes.map((q): PublicQuiz => ({ id: q.id, title: q.title, code: q.code, timed: q.timed, builtIn: q.builtIn, topic: q.topic, icon: q.icon, description: q.description, difficultyLabel: q.difficultyLabel, questionCount: (q.questions as unknown as QuizInput["questions"]).length })) };
}); }
export async function JOIN(request: Request) { return guarded(async () => {
  checkOrigin(request); const input = joinSchema.parse(await request.json()); const ownerKey = await guestIdentity();
  const quiz = await getDb().quiz.findUnique({ where: { code: input.code } });
  if (!quiz || !quiz.published) throw new ArenaError(404, "This quiz is unavailable. Check the code with its creator.");
  const profile = await getPlayer(ownerKey);
  if (!BASE_AVATARS.includes(input.avatar as typeof BASE_AVATARS[number]) && !profile.unlockedAvatars.includes(input.avatar)) throw new ArenaError(403, "Earn this avatar by scoring above 90% on a library quiz first.");
  await getDb().playerProfile.update({ where: { ownerKey }, data: { name: input.name, avatar: input.avatar } });
  const authored = quiz.questions as unknown as QuizInput["questions"];
  const questions = authored.map((q) => {
    const id = randomUUID(); const options = [q.options[q.correctIndex], ...q.options.filter((_, i) => i !== q.correctIndex)];
    return { id, snapshot: { id, category: "science", prompt: q.prompt, options, explanation: q.explanation || "The quiz creator marked this as the correct answer." }, choices: shuffled(options.map((_, option) => ({ option, id: randomUUID() })), seededRandom(id)) };
  });
  const attempt = await getDb().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerKey}))::text`;
    const open = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Quiz" WHERE "id" = ${quiz.id} AND "published" = TRUE FOR SHARE`;
    if (!open.length) throw new ArenaError(404, "This quiz is closed to new participants.");
    const existing = await tx.gameAttempt.findFirst({ where: { ownerKey, quizId: quiz.id, participantName: input.name, participantAvatar: input.avatar, completedAt: null, abandonedAt: null } });
    if (existing) return existing;
    if (await tx.gameAttempt.count({ where: { ownerKey, quizId: quiz.id, startedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } }) >= 20) throw new ArenaError(429, "You have started lots of attempts recently. Please try this quiz again later.");
    return tx.gameAttempt.create({ data: { ownerKey, quizId: quiz.id, participantName: input.name, participantAvatar: input.avatar, config: json({ category: "mixed", difficulty: "EASY", timed: quiz.timed, daily: false }), state: json({ phase: "question", index: 0, questions, answers: [], questionStartedAt: new Date().toISOString(), streak: 0, quiz: { title: quiz.title, code: quiz.code, builtIn: quiz.builtIn } }) } });
  });
  return { attempt: publicView(attempt) };
}); }

export async function PLAYER() { return guarded(async () => getPlayer(await guestIdentity())); }

export async function HISTORY(request: Request) { return guarded(async () => {
  const ownerKey = await guestIdentity(); const db = getDb();
  const cursor = z.string().max(100).optional().parse(new URL(request.url).searchParams.get("cursor") ?? undefined);
  const where = { ownerKey, quizId: { not: null } };
  // A cursor belonging to someone else cannot influence this player's history.
  if (cursor && !await db.gameAttempt.findFirst({ where: { ...where, id: cursor }, select: { id: true } })) throw new ArenaError(404, "History page not found.");
  const [player, rows, totalAttempts, finishedAttempts] = await Promise.all([
    getPlayer(ownerKey), db.gameAttempt.findMany({ where, take: 31, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), orderBy: [{ startedAt: "desc" }, { id: "desc" }], include: { quiz: { select: { title: true, code: true, icon: true } } } }),
    db.gameAttempt.count({ where }), db.gameAttempt.count({ where: { ...where, completedAt: { not: null } } }),
  ]);
  const attempts = rows.slice(0, 30).map((a) => {
    const state = a.state as { questions?: unknown[]; answers?: unknown[]; playerReward?: import("../quizzes/contracts").PlayerRewardSummary };
    const total = state.questions?.length ?? 0;
    return { id: a.id, quizId: a.quizId!, title: a.quiz!.title, code: a.quiz!.code, icon: a.quiz!.icon, name: a.participantName ?? "Explorer", avatar: a.participantAvatar ?? "owl", total, correct: a.correctCount, answered: state.answers?.length ?? 0, score: a.score, accuracy: a.completedAt && total ? Math.round(a.correctCount / total * 100) : null, startedAt: a.startedAt.toISOString(), completedAt: a.completedAt?.toISOString() ?? null, abandoned: Boolean(a.abandonedAt), reward: state.playerReward ?? null };
  });
  return { player, attempts, totalAttempts, finishedAttempts, nextCursor: rows.length > 30 ? attempts.at(-1)!.id : null };
}); }

export async function CREATOR_OVERVIEW() { return guarded(async () => {
  const creatorId = await creator(); const db = getDb();
  const quizzes = await db.quiz.findMany({ where: { creatorId }, orderBy: { createdAt: "desc" } });
  const ids = quizzes.map((q) => q.id);
  const [counts, completed] = await Promise.all([
    db.gameAttempt.groupBy({ by: ["quizId"], where: { quizId: { in: ids } }, _count: { _all: true } }),
    db.gameAttempt.groupBy({ by: ["quizId"], where: { quizId: { in: ids }, completedAt: { not: null } }, _count: { _all: true }, _avg: { correctCount: true } }),
  ]);
  const data = quizzes.map((q) => {
    const stats = completed.find((s) => s.quizId === q.id); const questionCount = (q.questions as unknown[]).length;
    return { id: q.id, title: q.title, code: q.code, timed: q.timed, published: q.published, questionCount, attempts: counts.find((s) => s.quizId === q.id)?._count._all ?? 0, finished: stats?._count._all ?? 0, averageAccuracy: stats?._avg.correctCount != null ? Math.round(stats._avg.correctCount / questionCount * 100) : null };
  });
  return { quizzes: data, totals: { quizzes: data.length, published: data.filter((q) => q.published).length, attempts: data.reduce((n, q) => n + q.attempts, 0), finished: data.reduce((n, q) => n + q.finished, 0) } };
}); }

export async function CREATOR_RESULTS(request: Request, context: { params: Promise<{ id: string }> }) { return guarded(async () => {
  const creatorId = await creator(); const { id } = await context.params; const db = getDb();
  const quiz = await db.quiz.findFirst({ where: { id, creatorId }, select: { questions: true } });
  if (!quiz) throw new ArenaError(404, "Quiz not found.");
  const cursor = z.string().max(100).optional().parse(new URL(request.url).searchParams.get("cursor") ?? undefined);
  if (cursor && !await db.gameAttempt.findFirst({ where: { id: cursor, quizId: id }, select: { id: true } })) throw new ArenaError(404, "Results page not found.");
  const [rows, total] = await Promise.all([db.gameAttempt.findMany({ where: { quizId: id }, take: 31, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), orderBy: [{ startedAt: "desc" }, { id: "desc" }] }), db.gameAttempt.count({ where: { quizId: id } })]);
  const participants = rows.slice(0, 30).map((a) => ({ id: a.id, name: a.participantName ?? "Participant", avatar: a.participantAvatar ?? "owl", score: a.score, correct: a.correctCount, total: (quiz.questions as unknown[]).length, startedAt: a.startedAt.toISOString(), completedAt: a.completedAt?.toISOString() ?? null }));
  return { participants, total, nextCursor: rows.length > 30 ? participants.at(-1)!.id : null };
}); }
