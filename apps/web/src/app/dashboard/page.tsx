import { redirect } from "next/navigation";
import { getSession } from "@mindquest/server/session";
import { getDb } from "@mindquest/server/db";
import { Dashboard } from "@/components/dashboard";
export const metadata = { title: "Your quests" };
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [quests, progress] = await Promise.all([
    getDb().quest.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    getDb().progress.findUnique({ where: { userId: session.user.id } }),
  ]);
  return <Dashboard name={session.user.name} totalXp={progress?.totalXp ?? 0} quests={quests.map((q) => ({ id: q.id, title: q.title, description: q.description, difficulty: q.difficulty, completed: q.completedAt !== null }))} />;
}
