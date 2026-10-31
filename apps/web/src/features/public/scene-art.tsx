import Image from "next/image";
import "./scene-art.css";
/** Decorative environment art: page headings and controls always stay live HTML. */
export function SceneArt({ kind = "adventure", className = "" }: { kind?: "creator" | "adventure"; className?: string }) {
  return <div className={`scene-art ${className}`} aria-hidden="true"><Image src={kind === "creator" ? "/images/creator-library.png" : "/images/trophy-garden.png"} alt="" fill sizes="(max-width: 720px) 100vw, 900px"/></div>;
}
