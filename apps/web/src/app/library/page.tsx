import Link from "next/link";
import { Library } from "@/features/quizzes/library";
import { WorldBrand } from "@/features/public/brand";
import "@/features/public/public.css";
import "./library-page.css";
export const metadata = { title: "Quiz library" };
export default function Page() {
  return <div className="public-world library-page"><header className="world-nav world-container"><WorldBrand/><nav className="world-nav-links" aria-label="Library navigation"><Link href="/">Home</Link><Link href="/me">My adventure</Link><Link href="/create">Create a quiz</Link></nav></header><main><div className="world-container library-page-title"><p className="world-eyebrow">PICK YOUR NEXT ADVENTURE</p><h1>Quiz library</h1></div><Library view="catalogue"/></main></div>;
}
