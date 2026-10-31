import { getSession } from "../session";
import { getDb } from "../db";
import { QUEST_XP } from "../game";
export const runtime = "nodejs";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getDb().$transaction(async (tx) => {
    const quest = await tx.quest.findFirst({ where: { id, userId: session.user.id } });
    if (!quest) return null;
    // The conditional update and XP award share one transaction: retries cannot award XP twice.
    const updated = await tx.quest.updateMany({ where: { id, userId: session.user.id, completedAt: null }, data: { completedAt: new Date() } });
    if (updated.count === 0) return { awardedXp: 0 };
    const awardedXp = QUEST_XP[quest.difficulty];
    await tx.progress.upsert({ where: { userId: session.user.id }, create: { userId: session.user.id, totalXp: awardedXp }, update: { totalXp: { increment: awardedXp } } });
    return { awardedXp };
  });
  if (!result) return Response.json({ error: "Quest not found" }, { status: 404 });
  return Response.json(result);
}
