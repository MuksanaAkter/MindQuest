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
    if (await tx.gameAttempt.count({ where: { ownerKey, quizId: quiz.id } }) >= 20) throw new ArenaError(429, "You have reached the attempt limit for this quiz.");
    return tx.gameAttempt.create({ data: { ownerKey, quizId: quiz.id, participantName: input.name, participantAvatar: input.avatar, config: json({ category: "mixed", difficulty: "EASY", timed: quiz.timed, daily: false }), state: json({ phase: "question", index: 0, questions, answers: [], questionStartedAt: new Date().toISOString(), streak: 0, quiz: { title: quiz.title, code: quiz.code, builtIn: quiz.builtIn } }) } });
  });
  return { attempt: publicView(attempt) };
}); }

export async function PLAYER() { return guarded(async () => getPlayer(await guestIdentity())); }
