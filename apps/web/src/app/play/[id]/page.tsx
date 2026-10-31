import { Arena } from "@/features/arena/arena";
export const metadata = { title: "Play quiz" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <Arena attemptId={(await params).id} />; }
