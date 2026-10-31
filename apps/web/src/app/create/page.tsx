import { redirect } from "next/navigation";
import { getSession } from "@mindquest/server/session";
import { CreatorStudio } from "@/features/quizzes/creator-studio";
export const metadata = { title: "Creator studio" };
export const dynamic = "force-dynamic";
export default async function Page() { if (!await getSession()) redirect("/login"); return <CreatorStudio />; }
