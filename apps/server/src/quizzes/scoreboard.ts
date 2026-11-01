import "server-only";
import { getDb } from "../db";
import { ArenaError } from "../games/knowledge/service";
import { AVATARS, type Avatar, type QuizScoreboard } from "./contracts";
import { playerLevel } from "./reward-rules";

type ScoreRow = { rank: number; name: string | null; avatar: string | null; score: number; totalXp: number; isYou: boolean; total: number };
export async function getQuizScoreboard(quizId: string, viewerKey: string, page: number): Promise<QuizScoreboard> {
  const db = getDb();
  if (!await db.quiz.findFirst({ where: { id: quizId, published: true }, select: { id: true } })) throw new ArenaError(404, "This quiz scoreboard is unavailable.");
  // Rank each player's best completed run in SQL, before applying pagination.
  // Owner keys, attempt IDs, email addresses and answer snapshots never leave the server.
  const rows = await db.$queryRaw<ScoreRow[]>`
    WITH best AS (
      SELECT DISTINCT ON (a."ownerKey") a."ownerKey", a."participantName", a."participantAvatar", a.score, a."correctCount", a."completedAt", a.id
      FROM "GameAttempt" a
      WHERE a."quizId" = ${quizId} AND a."completedAt" IS NOT NULL AND a."abandonedAt" IS NULL
      ORDER BY a."ownerKey", a.score DESC, a."correctCount" DESC, a."completedAt" ASC, a.id ASC
    )
    SELECT (ROW_NUMBER() OVER (ORDER BY b.score DESC, b."correctCount" DESC, b."completedAt" ASC, b.id ASC))::int AS rank,
      b."participantName" AS name, b."participantAvatar" AS avatar, b.score,
      COALESCE(p."totalXp", 0)::int AS "totalXp", (b."ownerKey" = ${viewerKey}) AS "isYou", (COUNT(*) OVER ())::int AS total
    FROM best b LEFT JOIN "PlayerProfile" p ON p."ownerKey" = b."ownerKey"
    ORDER BY b.score DESC, b."correctCount" DESC, b."completedAt" ASC, b.id ASC
    LIMIT 31 OFFSET ${page * 30}
  `;
  let total = rows[0]?.total ?? 0;
  if (!rows.length && page > 0) {
    const count = await db.$queryRaw<{ total: number }[]>`SELECT COUNT(DISTINCT "ownerKey")::int AS total FROM "GameAttempt" WHERE "quizId" = ${quizId} AND "completedAt" IS NOT NULL AND "abandonedAt" IS NULL`;
    total = count[0].total;
  }
  return {
    entries: rows.slice(0, 30).map((row) => ({ rank: row.rank, name: row.name ?? "Explorer", avatar: AVATARS.includes(row.avatar as Avatar) ? row.avatar as Avatar : "owl", score: row.score, level: playerLevel(row.totalXp), isYou: row.isYou })),
    total, nextPage: rows.length > 30 ? page + 1 : null,
  };
}
