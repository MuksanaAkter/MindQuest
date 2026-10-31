import { redirect } from "next/navigation";
import { getSession } from "@mindquest/server/session";
import { CreatorDashboard } from "@/features/quizzes/creator-overview";
export const metadata = { title: "Creator dashboard" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <CreatorDashboard name={session.user.name}/>;
}
