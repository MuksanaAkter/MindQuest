import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "../../db";
import type { GameAttempt, Prisma } from "../../generated/prisma/client";
import type { AnswerReview, ArenaConfig, ArenaOverview, ArenaView } from "../shared/contracts";
import { answerPoints, QUESTION_SECONDS, resultRank, roundXp } from "../shared/scoring";
import { grantLibraryReward } from "../../quizzes/player";
import type { PlayerRewardSummary } from "../../quizzes/contracts";
import { QUESTIONS } from "./questions";
import { seededRandom, selectQuestions, shuffled } from "./selection";
export type Owner = { key: string; userId: string | null; name: string; guestKey?: string };
type StoredQuestion = { snapshot?: { id: string; category: "science"; prompt: string; options: string[]; explanation: string }; id: string; choices: { id: string; option: number }[] };
type AttemptState = { phase: ArenaView["phase"]; index: number; questions: StoredQuestion[]; answers: AnswerReview[]; questionStartedAt: string; streak: number; playerReward?: PlayerRewardSummary; quiz?: { title: string; code: string; builtIn?: boolean } };
export class ArenaError extends Error { constructor(public status: number, message: string) { super(message); } }
const asJson = (value: object) => value as unknown as Prisma.InputJsonValue;
const stateOf = (attempt: GameAttempt) => attempt.state as unknown as AttemptState;
const configOf = (attempt: GameAttempt) => attempt.config as unknown as ArenaConfig;
function questionFor(id: string) {
  const question = QUESTIONS.find((q) => q.id === id);
  if (!question) throw new ArenaError(500, "This question is unavailable. Start a new expedition.");
  return question;
}
export function publicView(attempt: GameAttempt): ArenaView {
  const state = stateOf(attempt); const config = configOf(attempt);
  const stored = state.questions[state.index]; const q = stored ? stored.snapshot ?? questionFor(stored.id) : null;
  return {
    ...(attempt.quizId && state.quiz ? { quiz: { library: state.quiz.builtIn ?? false, id: attempt.quizId, title: state.quiz.title, code: state.quiz.code, participantName: attempt.participantName ?? "Participant", avatar: attempt.participantAvatar ?? "owl" } } : {}),
    ...(state.playerReward ? { playerReward: state.playerReward } : {}),
    id: attempt.id, config, phase: state.phase, index: state.index, total: state.questions.length,
    score: attempt.score, correctCount: attempt.correctCount, streak: state.streak,
    bestStreak: attempt.bestStreak, xpAwarded: attempt.xpAwarded, authenticated: !!attempt.userId,
    question: state.phase === "question" && q ? { id: q.id, category: q.category, prompt: q.prompt, options: stored.choices.map((c) => ({ id: c.id, text: q.options[c.option] })) } : null,
    deadline: config.timed && state.phase === "question" ? new Date(new Date(state.questionStartedAt).getTime() + QUESTION_SECONDS[config.difficulty] * 1000).toISOString() : null,
    serverTime: new Date().toISOString(), feedback: state.phase === "feedback" ? state.answers.at(-1) ?? null : null,
    reviews: state.answers, rank: resultRank(Math.round(attempt.correctCount / state.questions.length * 5)),
  };
}
export async function overview(owner: Owner): Promise<ArenaOverview> {
  const db = getDb();
  const [history, active, progress, daily] = await Promise.all([
    db.gameAttempt.findMany({ where: { ownerKey: owner.key, quizId: null, completedAt: { not: null } }, orderBy: { completedAt: "desc" }, take: 30 }),
    db.gameAttempt.findFirst({ where: { ownerKey: owner.key, quizId: null, completedAt: null, abandonedAt: null }, orderBy: { startedAt: "desc" } }),
    owner.userId ? db.progress.findUnique({ where: { userId: owner.userId } }) : null,
    db.gameAttempt.findFirst({ where: { ownerKey: owner.key, quizId: null, completedAt: { not: null }, startedAt: { gte: new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z") }, config: { path: ["daily"], equals: true } }, select: { id: true } }),
  ]);
  return { authenticated: !!owner.userId, name: owner.name, totalXp: progress?.totalXp ?? 0, activeId: active?.id ?? null,
    dailyCompleted: !!daily,
    history: history.map((a) => ({ id: a.id, score: a.score, correctCount: a.correctCount, config: configOf(a), completedAt: a.completedAt!.toISOString(), xpAwarded: a.xpAwarded })),
  };
}
export async function startRound(owner: Owner, requested: ArenaConfig) {
  const config: ArenaConfig = requested.daily ? { category: "mixed", difficulty: "MEDIUM", timed: true, daily: true } : requested;
  const now = new Date(); const seed = config.daily ? `daily-v1-${now.toISOString().slice(0, 10)}` : randomUUID();
  const questions = selectQuestions(config, seed).map((q) => ({ id: q.id, choices: shuffled(q.options.map((_, option) => ({ option, id: randomUUID() })), seededRandom(`${seed}-${q.id}`)) }));
  const state: AttemptState = { phase: "question", index: 0, questions, answers: [], questionStartedAt: now.toISOString(), streak: 0 };
  const attempt = await getDb().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${owner.key}))::text`;
    const recent = await tx.gameAttempt.count({ where: { ownerKey: owner.key, startedAt: { gte: new Date(now.getTime() - 3600000) } } });
    if (recent >= 60) throw new ArenaError(429, "Take a short break. You can start more expeditions in an hour.");
    await tx.gameAttempt.updateMany({ where: { ownerKey: owner.key, quizId: null, completedAt: null, abandonedAt: null }, data: { abandonedAt: now } });
    return tx.gameAttempt.create({ data: { ownerKey: owner.key, userId: owner.userId, config: asJson(config), state: asJson(state) } });
  });
  return publicView(attempt);
}
export async function readRound(owner: Owner, id: string) {
  const attempt = await getDb().gameAttempt.findFirst({ where: { id, ownerKey: { in: [owner.key, ...(owner.guestKey ? [owner.guestKey] : [])] }, abandonedAt: null } });
  if (!attempt) throw new ArenaError(404, "Expedition not found. Start a new round.");
  const view = publicView(attempt);
  return attempt.completedAt ? { ...view, phase: "results" as const, feedback: null, question: null, deadline: null } : view;
}
export async function actOnRound(owner: Owner, id: string, action: { action: "answer"; questionId: string; choiceId: string | null } | { action: "next"; questionId: string }) {
  return getDb().$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "GameAttempt" WHERE "id" = ${id} AND ("ownerKey" = ${owner.key} OR "ownerKey" = ${owner.guestKey ?? owner.key}) AND "abandonedAt" IS NULL FOR UPDATE`;
    if (!locked.length) throw new ArenaError(404, "Expedition not found. Start a new round.");
    const attempt = await tx.gameAttempt.findUniqueOrThrow({ where: { id } });
    const state = stateOf(attempt); const config = configOf(attempt); const stored = state.questions[state.index];
    if (action.questionId !== stored.id) throw new ArenaError(409, "This question has already moved on. Resume the current round.");
    if (action.action === "next") {
      if (state.phase !== "feedback") return publicView(attempt);
      if (attempt.completedAt) state.phase = "results";
      else { state.index++; state.phase = "question"; state.questionStartedAt = new Date().toISOString(); }
      return publicView(await tx.gameAttempt.update({ where: { id }, data: { state: asJson(state) } }));
    }
    if (state.phase !== "question") return publicView(attempt);
    const q = stored.snapshot ?? questionFor(stored.id); const chosen = stored.choices.find((c) => c.id === action.choiceId);
    if (action.choiceId !== null && !chosen) throw new ArenaError(400, "Choose one of the available answers.");
    const timedOut = config.timed && Date.now() >= new Date(state.questionStartedAt).getTime() + QUESTION_SECONDS[config.difficulty] * 1000;
    if (action.choiceId === null && !timedOut) throw new ArenaError(400, "Select an answer before continuing.");
    const correct = !timedOut && chosen?.option === 0;
    state.streak = correct ? state.streak + 1 : 0;
    const points = answerPoints(correct, state.streak, config.difficulty);
    state.answers.push({ questionId: q.id, prompt: q.prompt, selected: !timedOut && chosen ? q.options[chosen.option] : null, answer: q.options[0], explanation: q.explanation, correct, points, timedOut });
    state.phase = "feedback";
    const correctCount = attempt.correctCount + Number(correct);
    const completed = state.answers.length === state.questions.length;
    let xpAwarded = 0;
    if (completed && owner.userId && !attempt.quizId) {
      const claimKey = config.daily ? `daily:${owner.userId}:${attempt.startedAt.toISOString().slice(0, 10)}` : `attempt:${id}`;
      const xp = roundXp(correctCount, config.difficulty);
      const claimed = await tx.gameReward.createMany({ data: [{ attemptId: id, userId: owner.userId, claimKey, xp }], skipDuplicates: true });
      if (claimed.count) {
        xpAwarded = xp;
        await tx.progress.upsert({ where: { userId: owner.userId }, create: { userId: owner.userId, totalXp: xp }, update: { totalXp: { increment: xp } } });
      }
    }
    if (completed && attempt.quizId) {
      const libraryQuiz = await tx.quiz.findUnique({ where: { id: attempt.quizId }, select: { builtIn: true } });
      if (libraryQuiz?.builtIn) state.playerReward = await grantLibraryReward(tx, attempt.ownerKey, attempt.quizId, correctCount, state.questions.length);
    }
    const updated = await tx.gameAttempt.update({ where: { id }, data: { state: asJson(state), score: attempt.score + points, correctCount, bestStreak: Math.max(attempt.bestStreak, state.streak), completedAt: completed ? new Date() : null, xpAwarded } });
    return publicView(updated);
  });
}
