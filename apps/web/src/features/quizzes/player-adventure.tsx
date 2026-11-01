"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Coins, Crown, Sparkles, Star, Trophy } from "lucide-react";
import { AVATARS, AVATAR_EMOJI, type PlayerHistory } from "@mindquest/server/quizzes/contracts";
import { avatarUnlockLevel } from "@mindquest/server/quizzes/reward-rules";
import { QuestLoader } from "@/components/quest-loader";
import { SceneArt } from "@/features/public/scene-art";
import { WorldBrand } from "@/features/public/brand";
import { useLibrary } from "./library-store";
import { quizApi } from "./api";
import "@/features/public/public.css";
import "./adventure.css";
export function PlayerAdventure() {
  const [data, setData] = useState<PlayerHistory | null>(null);
  const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  const setAvatar = useLibrary((state) => state.setAvatar);
  useEffect(() => {
    let cancelled = false;
    quizApi<PlayerHistory>("/api/player/history").then((result) => { if (!cancelled) setData(result); }).catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Your adventure could not load. Please try again."); });
    return () => { cancelled = true; };
  }, []);
  async function more() {
    if (!data?.nextCursor || pending) return;
    setPending(true); setError("");
    try { const next = await quizApi<PlayerHistory>(`/api/player/history?cursor=${encodeURIComponent(data.nextCursor)}`); setData({ ...next, attempts: [...data.attempts, ...next.attempts] }); }
    catch(e) { setError(e instanceof Error ? e.message : "Please try again."); } finally { setPending(false); }
  }
  const player = data?.player;
  return <div className="public-world player-world"><header className="world-container adventure-nav"><WorldBrand/><nav><Link href="/library"><BookOpen size={15}/>Find a quiz</Link><Link href="/me" aria-current="page"><Star size={15}/>My adventure</Link></nav></header><main className="world-container adventure-main">
    <section className="adventure-welcome"><SceneArt/><div><p className="world-eyebrow">YOUR VERY OWN ADVENTURE BOOK</p><h1>Look how far you’ve come{player && player.name !== "Explorer" ? `, ${player.name}` : ""}!</h1><p>Every quiz is a new little discovery. Your past games, treasures, and friends are right here.</p><Link className="world-button" href="/library">Let’s play a quiz<ArrowRight size={16}/></Link></div><span className="adventure-mascot" aria-hidden="true">{AVATAR_EMOJI[player?.avatar ?? "owl"]}</span></section>
    {error && <div role="alert" className="auth-error">{error} {!data && <button onClick={() => window.location.reload()} className="underline">Try again</button>}</div>}
    {!data && !error && <QuestLoader label="Opening your adventure book…"/>}
    {data && <><section className="adventure-stat-grid" aria-label="My rewards"><article><Sparkles/><strong>Level {player!.level}</strong><span>{player!.totalXp} XP earned</span></article><article><Coins/><strong>{player!.coins}</strong><span>Virtual coins</span></article><article><Trophy/><strong>{data.finishedAttempts}</strong><span>Quizzes finished</span></article><article><Crown/><strong>{player!.masteredQuizzes}</strong><span>Trophies won</span></article></section>
    <section className="adventure-level"><div><h2>Your next level is getting closer!</h2><span>{player!.xpInLevel}/300 XP</span></div><div role="progressbar" aria-label="My level progress" aria-valuemin={0} aria-valuemax={300} aria-valuenow={player!.xpInLevel}><span style={{width:`${player!.xpInLevel / 3}%`}}/></div><p>{300 - player!.xpInLevel} more XP to level {player!.level + 1}. Improve your library quiz scores to earn more treasure.</p></section>
    <section className="adventure-history" aria-labelledby="past-games"><div className="adventure-section-title"><div><p className="world-eyebrow">EVERY TRY IS PART OF YOUR STORY</p><h2 id="past-games">My past games</h2></div><span>{data.totalAttempts} saved adventures</span></div>{data.attempts.length === 0 ? <div className="adventure-empty"><span aria-hidden="true">🌱</span><h3>Your story starts with one quiz.</h3><p>Pick a topic you like. Your result will appear here when you play.</p><Link className="world-button" href="/library">Find my first quiz<ArrowRight size={15}/></Link></div> : <div className="adventure-records">{data.attempts.map((a) => <article className="adventure-record" key={a.id}><span className="record-icon" aria-hidden="true">{a.icon}</span><div className="record-description"><h3>{a.title}</h3><p>{a.name} · {new Date(a.startedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</p><span className={`record-status ${a.completedAt ? "finished" : ""}`}>{a.completedAt ? "Finished" : a.abandoned ? "Round ended" : `Keep going · ${a.answered}/${a.total} answered`}</span>{a.reward && <small className="record-treasure">{(a.reward.trophy ?? (a.reward.accuracy > 90)) ? "🏆 >90% Trophy" : a.reward.badge} · +{a.reward.xp} XP · +{a.reward.coins} coins{a.reward.unlockedAvatar ? ` · ${a.reward.unlockedAvatar} unlocked!` : ""}</small>}</div><div className="record-score"><strong>{a.completedAt ? `${a.accuracy}%` : `${a.score} pts`}</strong><span>{a.completedAt ? `${a.correct}/${a.total} correct · ${a.score} pts` : "Progress saved"}</span></div><Link href={a.completedAt ? `/results/${a.id}` : `/play/${a.id}`} className="world-button secondary">{a.completedAt ? "See my result" : "Continue playing"}<ArrowRight size={14}/></Link></article>)}</div>}{data.nextCursor && <button className="world-button secondary adventure-more" disabled={pending} onClick={more}>{pending ? "Opening more games…" : "Show older games"}</button>}</section>
    <section className="adventure-trophies" aria-labelledby="my-trophies"><div className="adventure-section-title"><div><p className="world-eyebrow">YOUR SHINING MOMENTS</p><h2 id="my-trophies">My trophy shelf</h2><p>Score strictly above 90% to win a trophy. Each quiz adds one trophy to your collection.</p></div><span>{player!.trophies.length} trophies</span></div>{player!.trophies.length ? <div className="trophy-shelf">{player!.trophies.map(trophy => <article key={trophy.quizId}><span aria-hidden="true">🏆</span><div><h3>{trophy.title}</h3><p>{trophy.accuracy}% best score</p><small>Above 90% · Trophy earned</small></div></article>)}</div> : <div className="adventure-empty"><span aria-hidden="true">🏆</span><h3>Your first trophy is waiting!</h3><p>Get 14 out of 15 answers correct to win your first one.</p></div>}</section>
    <section className="adventure-friends"><div className="adventure-section-title"><div><p className="world-eyebrow">A FRIEND FOR EVERY ADVENTURE</p><h2>My avatar collection</h2><p>Five avatars are free. Unlock one more at each level from 2 to 11.</p></div><span>{player!.unlockedAvatars.length}/{AVATARS.length} friends</span></div><div className="adventure-avatar-grid">{AVATARS.map((avatar) => player!.unlockedAvatars.includes(avatar) ? <Link key={avatar} href="/library#join-quiz" aria-label={`Play with ${avatar}`} onClick={() => setAvatar(avatar)}><span aria-hidden="true">{AVATAR_EMOJI[avatar]}</span><strong>{avatar}</strong><small>Ready to play ✓</small></Link> : <div key={avatar} className="locked-friend" aria-label={`Locked ${avatar}`}><span aria-hidden="true">{AVATAR_EMOJI[avatar]}</span><strong>{avatar}</strong><small>🔒 Level {avatarUnlockLevel(avatar)}</small></div>)}</div></section><p className="adventure-browser-note">Your adventure is saved automatically in this browser—no login needed. Use the same browser next time to find it here. Clearing its cookies or switching devices starts a new adventure. All coins and prizes are virtual.</p></>}
  </main></div>;
}
