import { getSession } from "../session";
import { getDb } from "../db";
import { questSchema } from "../validations/quest";
export const runtime = "nodejs";
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const quests = await getDb().quest.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });
  return Response.json({ quests });
}
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = questSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid quest", issues: parsed.error.flatten() }, { status: 400 });
  const quest = await getDb().quest.create({ data: { ...parsed.data, userId: session.user.id } });
  return Response.json({ quest }, { status: 201 });
}
