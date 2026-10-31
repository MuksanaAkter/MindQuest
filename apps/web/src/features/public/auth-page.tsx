import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Swords } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { SceneArt } from "./scene-art";
import { WorldBrand } from "./brand";
import { publicCopy as c } from "./copy";
import "./public.css";
export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  return <main className="public-world auth-world"><section className="auth-visual" aria-label="MindQuest world"><Image src="/images/creator-library.png" alt="An enchanted library with glowing books and a friendly owl" fill preload loading="eager" sizes="55vw" /><div className="auth-visual-shade" /><WorldBrand /><div className="auth-story"><div className="world-eyebrow"><Sparkles size={12} />{c.authEyebrow}</div><h2 className="serif">{c.authTitle}</h2><p>{c.authDescription}</p><p className="auth-tagline">{c.tagline}</p></div></section><section className="auth-form-side"><SceneArt kind="creator" className="auth-mobile-scene"/><div className="auth-mobile-brand"><WorldBrand /></div><Link className="auth-home" href="/"><ArrowLeft size={12} />{c.home}</Link><div className="auth-panel"><div className="auth-panel-icon"><Swords size={23} strokeWidth={1.4} /></div><h1 className="serif">{signup ? c.signupTitle : c.loginTitle}</h1><p>{signup ? c.signupDescription : c.loginDescription}</p><AuthForm mode={mode} /><p className="auth-account-note"><ShieldCheck size={12} />{c.accountNote}</p></div></section></main>;
}
