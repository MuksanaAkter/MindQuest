import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Library } from "@/features/quizzes/library";
import { WorldBrand } from "./brand";
import { publicCopy as c } from "./copy";
import "./public.css";
export function Landing() {
  return <div className="public-world"><div className="landing-hero kid-hero"><div className="landing-art"><Image src="/images/curiosity-kingdom.png" alt="A friendly purple owl and orange fox exploring an enchanted floating castle" fill preload loading="eager" sizes="100vw" /></div><div className="landing-shade" /><header className="world-nav world-container"><WorldBrand /><nav className="world-nav-links" aria-label="Main navigation"><a className="world-explore" href="#quest-library">Quest library</a><Link href="/login">{c.login}</Link><Link href="/create" className="world-button">{c.signup}<ArrowUpRight size={13} /></Link></nav></header><main className="landing-hero-content world-container"><div className="world-eyebrow"><Sparkles size={13} />BIG ADVENTURES FOR CURIOUS MINDS</div><h1 className="serif">{c.title}</h1><p className="landing-hero-description">{c.description}</p><div className="landing-actions"><a href="#quest-library" className="world-button">Explore free quizzes<ArrowRight size={16} /></a><a href="#join-quiz" className="world-button secondary">Have a quiz code?</a></div><p className="landing-guest-note">{c.guestNote}</p></main><div aria-hidden="true" className="hero-buddy-label"><span>🦉 🦊</span>Your next adventure buddies are waiting!</div><span aria-hidden="true" className="hero-sparkle one">✦</span><span aria-hidden="true" className="hero-sparkle two">✧</span><span aria-hidden="true" className="hero-sparkle three">✦</span></div>
    <Library />
    <footer className="world-footer world-container"><span>{c.brand} · Be curious. Be kind. Keep discovering.</span><Link href="/create">{c.signup} <ArrowRight size={11} className="inline" /></Link></footer></div>;
}
