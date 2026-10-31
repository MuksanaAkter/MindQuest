"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import "./animated-hero.css";

function subscribeMotion(notify: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
function allowsVideo() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !connection?.saveData;
}
export function AnimatedHeroArt() {
  const enabled = useSyncExternalStore(subscribeMotion, allowsVideo, () => false);
  const video = useRef<HTMLVideoElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (scene.current) observer.observe(scene.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    function syncPlayback() {
      if (!enabled || paused || !visible || document.hidden) element!.pause();
      else void element!.play().catch(() => setBlocked(true));
    }
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => document.removeEventListener("visibilitychange", syncPlayback);
  }, [enabled, paused, visible]);
  const stopped = paused || blocked;
  function toggle() {
    if (stopped) {
      setPaused(false); setBlocked(false);
      void video.current?.play().catch(() => setBlocked(true));
    } else { video.current?.pause(); setPaused(true); }
  }
  return <>
    <div ref={scene} className="hero-video-scene" aria-label="Animated magical kingdom with an owl, fox, waterfalls and glowing portal">
      <Image src="/videos/mindquest-kingdom-poster.webp" alt="A friendly purple owl and orange fox exploring an enchanted floating castle" fill preload sizes="100vw" className="hero-video-poster"/>
      {enabled && !failed && <video ref={video} data-testid="hero-video" className={`hero-background-video ${ready ? "ready" : ""}`} autoPlay loop muted playsInline preload="metadata" poster="/videos/mindquest-kingdom-poster.webp" aria-hidden="true" tabIndex={-1} disablePictureInPicture onPlaying={() => { setReady(true); setBlocked(false); }} onLoadStart={() => setReady(false)} onError={(event) => { if (event.target === event.currentTarget) setFailed(true); }}>
        <source src="/videos/mindquest-kingdom-mobile.mp4" type="video/mp4" media="(max-width: 720px)"/>
        <source src="/videos/mindquest-kingdom.mp4" type="video/mp4"/>
        <source src="/videos/mindquest-kingdom.webm" type="video/webm" onError={() => setFailed(true)}/>
      </video>}
    </div>
    <button className="hero-animation-toggle" aria-pressed={stopped} disabled={!enabled || failed} onClick={toggle}>{!enabled || failed || stopped ? <Play size={12}/> : <Pause size={12}/>} {!enabled || failed ? "Still image" : stopped ? "Play animation" : "Pause animation"}</button>
  </>;
}
