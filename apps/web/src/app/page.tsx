import { redirect } from "next/navigation";
import { Landing } from "@/features/public/landing";
export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const { code } = await searchParams;
  if (code) redirect(`/library?code=${encodeURIComponent(Array.isArray(code) ? code[0] : code)}#join-quiz`);
  return <Landing/>;
}
