import Link from "next/link";
import { WorldBrand } from "@/features/public/brand";
import { SceneArt } from "@/features/public/scene-art";
import "@/features/public/public.css";
export default function NotFound() {
  return <main className="public-world world-status-page"><SceneArt/><section className="world-status-card"><WorldBrand/><p className="world-eyebrow">A LITTLE DETOUR · 404</p><h1 className="serif">This quest hasn’t been discovered.</h1><p>The path may have changed, but there’s a whole world of questions waiting for you.</p><div className="world-status-actions"><Link href="/" className="world-button">Back to MindQuest</Link><Link href="/me" className="world-button secondary">My adventure</Link></div></section></main>;
}
