"use client";
import Link from "next/link";
import { WorldBrand } from "@/features/public/brand";
import { SceneArt } from "@/features/public/scene-art";
import "@/features/public/public.css";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="public-world world-status-page"><SceneArt/><section className="world-status-card"><WorldBrand/><p className="world-eyebrow">EVEN GREAT ADVENTURES TAKE A DETOUR</p><h1 className="serif">Something went wrong.</h1><p>Your next discovery is still waiting. Try again, or head back to the kingdom to choose a new path.</p><div className="world-status-actions"><button onClick={reset} className="world-button">Try again</button><Link href="/" className="world-button secondary">Back home</Link></div></section></main>;
}
