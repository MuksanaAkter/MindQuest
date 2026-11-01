import { Arena } from "@/features/arena/arena";
export const metadata = { title: "Quiz result" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <Arena attemptId={(await params).id} resultsPage/>; }
