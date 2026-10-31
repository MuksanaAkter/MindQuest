"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ArrowLeft, BookOpen, Brain, Check, ChevronDown, ChevronRight, Clock3, Compass, Crown, Flame, Globe2, History, Leaf, LockKeyhole, Orbit, ShieldCheck, Sparkles, Star, Swords, Target, Trophy, Volume2, VolumeX, WandSparkles, X } from "lucide-react";
import type { ArenaConfig, ArenaOverview, ArenaView, Category } from "@mindquest/server/arena/contracts";
import { QUESTION_SECONDS } from "@mindquest/server/arena/scoring";
import { CATEGORIES, DIFFICULTIES } from "@mindquest/server/arena/contracts";
import { useArenaUi } from "./store";
import { arenaCopy as c } from "./copy";
import "./arena.css";
const categoryIcons = { mixed: Sparkles, science: Orbit, world: Globe2, history: History };
async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : c.networkError);
  return data as T;
}
function playFeedback(correct: boolean) {
  try {
    const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.connect(gain); gain.connect(context.destination); oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(correct ? 523.25 : 220, context.currentTime);
    oscillator.frequency.setValueAtTime(correct ? 783.99 : 164.81, context.currentTime + .12);
    gain.gain.setValueAtTime(.07, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .35);
    oscillator.start(); oscillator.stop(context.currentTime + .36); oscillator.onended = () => { void context.close(); };
  } catch { /* Sound is optional; gameplay works without Web Audio. */ }
}
function Guide({ dialogRef }: { dialogRef: React.RefObject<HTMLDialogElement | null> }) {
  return <dialog ref={dialogRef} className="arena-dialog" onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}><h2 className="serif">{c.guideTitle}</h2><ol>{c.guideSteps.map((step) => <li key={step}>{step}</li>)}</ol><button className="arena-button" onClick={() => dialogRef.current?.close()}>{c.close}<ArrowRight size={14} /></button></dialog>;
}
export function Arena() {
  const { config, setConfig, sound, toggleSound } = useArenaUi();
  const [overview, setOverview] = useState<ArenaOverview | null>(null);
  const [round, setRound] = useState<ArenaView | null>(null);
  const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true); const [choice, setChoice] = useState<string | null>(null);
  const [clock, setClock] = useState({ remaining: 0, elapsed: 0, questionId: "" });
  const guide = useRef<HTMLDialogElement>(null); const setup = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null); const inFlight = useRef(false); const expiredFor = useRef<string | null>(null);
  const reduced = useReducedMotion();
  const loadOverview = useCallback(async () => {
    try { const data = await api<ArenaOverview>("/api/arena"); setOverview(data); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : c.networkError); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadOverview(); }, [loadOverview]);
  const setView = useCallback((view: ArenaView) => { setRound(view); setChoice(null); setError(""); expiredFor.current = null; }, []);
  async function start(daily = false, requested: ArenaConfig = config) {
    if (inFlight.current) return; inFlight.current = true; setPending(true); setError("");
    try { setView(await api<ArenaView>("/api/arena", { ...requested, daily })); window.scrollTo({ top: 0, behavior: "instant" }); }
    catch (e) { setError(e instanceof Error ? e.message : c.networkError); }
    finally { inFlight.current = false; setPending(false); }
  }
  async function resume(id: string) {
    if (inFlight.current) return; inFlight.current = true; setPending(true); setError("");
    try { setView(await api<ArenaView>(`/api/arena/${id}`)); window.scrollTo({ top: 0, behavior: "instant" }); }
    catch (e) { setError(e instanceof Error ? e.message : c.networkError); }
    finally { inFlight.current = false; setPending(false); }
  }
  const answer = useCallback(async (selected: string | null) => {
    if (!round?.question || inFlight.current) return;
    inFlight.current = true; setPending(true); setError("");
    try {
      const view = await api<ArenaView>(`/api/arena/${round.id}`, { action: "answer", questionId: round.question.id, choiceId: selected });
      setView(view); if (sound && view.feedback) playFeedback(view.feedback.correct);
    } catch (e) { setError(e instanceof Error ? e.message : c.networkError); }
    finally { inFlight.current = false; setPending(false); }
  }, [round, sound, setView]);
  async function next() {
    if (!round?.feedback || inFlight.current) return;
    inFlight.current = true; setPending(true); setError("");
    try { setView(await api<ArenaView>(`/api/arena/${round.id}`, { action: "next", questionId: round.feedback.questionId })); }
    catch (e) { setError(e instanceof Error ? e.message : c.networkError); }
    finally { inFlight.current = false; setPending(false); }
  }
  function lobby() { setLoading(true); setRound(null); setChoice(null); setError(""); void loadOverview(); }
  useEffect(() => {
    if (!round?.deadline || round.phase !== "question") return;
    const duration = new Date(round.deadline).getTime() - new Date(round.serverTime).getTime();
    const start = performance.now();
    function update() { const elapsed = performance.now() - start; setClock({ remaining: Math.max(0, Math.ceil((duration - elapsed) / 1000)), elapsed, questionId: round?.question?.id ?? "" }); }
    update(); const interval = window.setInterval(update, 200); return () => window.clearInterval(interval);
  }, [round]);
  useEffect(() => {
    if (round?.phase !== "question" || !round.deadline || error || pending || !round.question) return;
    const initialDuration = new Date(round.deadline).getTime() - new Date(round.serverTime).getTime();
    if (clock.questionId === round.question.id && clock.elapsed >= initialDuration + 150 && expiredFor.current !== `${round.id}:${round.question.id}`) {
      expiredFor.current = `${round.id}:${round.question.id}`; void answer(null);
    }
  }, [round, clock, answer, error, pending]);
  useEffect(() => {
    if (!round) return;
    heading.current?.focus({ preventScroll: true });
  }, [round]);
  useEffect(() => {
    if (round?.phase !== "question" || !round.question) return;
    const question = round.question;
    function keydown(event: KeyboardEvent) {
      if (pending || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || guide.current?.open) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < 4 && question.options[index]) { event.preventDefault(); setChoice(question.options[index].id); }
      if (event.key === "Enter" && choice && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); void answer(choice); }
    }
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  }, [round, choice, pending, answer]);
  const showGuide = () => guide.current?.showModal();
  const correctTotal = overview?.history.reduce((sum, attempt) => sum + attempt.correctCount, 0) ?? 0;
  const historyCount = overview?.history.length ?? 0;
  const best = Math.max(0, ...(overview?.history.map((a) => a.score) ?? []));
  const currentCategory: Category = round?.config.category ?? config.category;
  const CategoryIcon = categoryIcons[currentCategory];
  return <div className="arena-shell">
    <aside className="arena-sidebar" aria-label="Game navigation">
      <Link href="/" className="arena-brand" onClick={round ? (e) => { e.preventDefault(); lobby(); } : undefined}><span className="arena-brand-mark"><BookOpen size={23} strokeWidth={1.4} /></span>{c.brand}</Link><p className="arena-tagline">{c.tagline}</p>
      <p className="arena-nav-label">YOUR ADVENTURE</p>
      <button className="arena-nav-link active" onClick={lobby}><Swords size={17} />{c.title}<ChevronRight size={12} className="ml-auto" /></button>
      <Link href="/dashboard" className="arena-nav-link"><Compass size={17} />{c.quests}</Link>
      <button className="arena-nav-link" onClick={showGuide}><BookOpen size={17} />{c.help}</button>
      <div className="arena-future"><p className="arena-nav-label">{c.other}</p>{c.future.map((name, i) => { const Icon = [WandSparkles, Brain, Leaf][i]; return <div className="arena-future-mode" key={name} title={c.futureHint}><Icon size={16} /><span>{name}</span><LockKeyhole size={11} /></div>; })}</div>
      <div className="arena-sidebar-bottom"><div className="arena-guide-card"><Sparkles size={20} color="#b598d7" /><p>Great minds were curious minds first. Yours is no different.</p><button onClick={showGuide}>{c.help}<ArrowUpRight size={12} /></button></div><div className="arena-guest"><span className="arena-avatar"><Crown size={17} /></span><div><strong>{overview?.authenticated ? overview.name : c.guest}</strong><Link href={overview?.authenticated ? "/dashboard" : "/login"}>{overview?.authenticated ? `${overview.totalXp} XP · View profile` : c.signIn + " to save your legacy"}</Link></div></div></div>
    </aside>
    <div className="arena-content"><header className="arena-topbar"><div className="arena-breadcrumb"><span>THE REALM</span><ChevronRight size={11} /><span>Knowledge Kingdom</span></div><div className="arena-top-actions"><span className="xp-tag"><Sparkles size={14} />{overview?.totalXp ?? 0} XP</span><button className="arena-icon-button" aria-label={sound ? c.soundOn : c.soundOff} aria-pressed={sound} onClick={toggleSound}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}</button><Link href={overview?.authenticated ? "/dashboard" : "/login"} className="arena-avatar" aria-label={overview?.authenticated ? "Your dashboard" : c.signIn}><Crown size={16} /></Link></div></header>
    <main className="arena-main">
      {error && <div role="alert" className="arena-alert"><span>{error}</span><button className="arena-button secondary" disabled={pending} onClick={() => round ? resume(round.id) : void loadOverview()}>{round ? c.recover : c.retry}</button></div>}
      {!round ? <>
        <div className="arena-intro"><div><div className="arena-eyebrow"><Swords size={12} />LEARN SOMETHING. BECOME SOMETHING.</div><h1 className="serif">{c.title}</h1><p>{c.subtitle}</p></div><span className="arena-pill"><span className="h-1 w-1 rounded-full bg-[#ac8ad2]" />{c.connected}</span></div>
        {overview?.activeId && <div className="arena-resume"><div><strong>{c.resume}</strong><p>{c.resumeHint}</p></div><button disabled={pending} className="arena-button secondary" onClick={() => resume(overview.activeId!)}><ArrowRight size={14} />Continue</button></div>}
        <section className="arena-hero" aria-label="Knowledge Kingdom"><Image src="/images/knowledge-kingdom.png" alt="A magical academy on floating islands, with glowing portals and waterfalls beneath a violet sky" fill preload sizes="(max-width:760px) 100vw, 80vw" /><div className="arena-hero-shade" /><div className="arena-hero-copy"><div className="arena-eyebrow"><Star size={11} />A WORLD OF WONDER AWAITS</div><h2 className="serif">{c.heroTitle}</h2><p>{c.heroBody}</p><button className="arena-button" onClick={() => { setup.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" }); setup.current?.querySelector("button")?.focus({ preventScroll: true }); }}>{c.enter}<ArrowRight size={14} /></button></div></section>
        <div className="arena-grid"><div><section ref={setup} aria-label={c.choose}><div className="arena-section-head"><div><h2 className="serif">{c.choose}</h2><p>{c.chooseHint}</p></div><span className="small-note"><Clock3 size={11} />5 questions · ~3 min</span></div>
          <div className="arena-categories" role="group" aria-label="Question category">{CATEGORIES.map((category) => { const Icon = categoryIcons[category]; return <button key={category} aria-pressed={config.category === category} onClick={() => setConfig({ category })} className={`arena-category ${config.category === category ? "selected" : ""}`}><span className="arena-category-icon"><Icon size={21} strokeWidth={1.4} /></span><span><strong>{c.categories[category].name}</strong><small>{c.categories[category].description}</small></span>{config.category === category && <span className="arena-selected-dot" />}</button>; })}</div>
          <div className="arena-settings"><p className="arena-label">{c.difficulty}</p><div className="arena-difficulty" role="group" aria-label="Difficulty">{DIFFICULTIES.map((difficulty, i) => <button key={difficulty} aria-pressed={config.difficulty === difficulty} className={config.difficulty === difficulty ? "selected" : ""} onClick={() => setConfig({ difficulty })}><span className="mb-1.5 inline-flex gap-0.5 text-[#ba9bd6]">{Array.from({ length: i + 1 }, (_, n) => <Star key={n} size={10} fill="currentColor" />)}</span><strong>{c.difficulties[difficulty].name}</strong><small>{c.difficulties[difficulty].detail}</small></button>)}</div>
          <div className="arena-timer-setting"><div className="arena-timer-copy"><Clock3 size={17} /><span><strong>{c.timed}</strong><small>{config.timed ? `${QUESTION_SECONDS[config.difficulty]} seconds per question. ${c.timedHint}` : c.relaxedHint}</small></span></div><button className={`arena-toggle ${config.timed ? "on" : ""}`} role="switch" aria-label={c.timed} aria-checked={config.timed} onClick={() => setConfig({ timed: !config.timed })}><span /></button></div>
          <div className="arena-start-row"><p><ShieldCheck size={12} />{c.difficulties[config.difficulty].reward} · +25 for a perfect round</p><button className="arena-button" disabled={pending || loading} onClick={() => start()}>{pending ? c.starting : c.start}<ArrowUpRight size={14} /></button></div></div>
          <p className="mt-3 text-[10px] leading-5 text-[#8b799c]">{overview?.authenticated ? c.saved : c.guestHint}</p>
        </section>
        <section className="arena-history"><div className="arena-section-head"><h2 className="serif">{c.history}</h2><span className="small-note"><History size={11} />Last 30 rounds</span></div>{loading ? <p className="arena-loading" role="status">{c.loading}</p> : !overview?.history.length ? <div className="arena-empty"><Compass size={21} className="mx-auto mb-3 opacity-60" /><strong className="text-xs font-normal">{c.noHistory}</strong><p>{c.noHistoryHint}</p></div> : overview.history.slice(0, 5).map((entry) => { const Icon = categoryIcons[entry.config.category]; return <button key={entry.id} className="arena-history-row" aria-label={`${c.viewResult}: ${entry.score} points`} disabled={pending} onClick={() => resume(entry.id)}><span className="arena-category-icon"><Icon size={16} /></span><span><strong>{entry.config.daily ? c.daily : c.categories[entry.config.category].short}</strong><small>{c.difficulties[entry.config.difficulty].name} · {new Date(entry.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></span><span className="history-score"><strong>{entry.score.toLocaleString()}</strong><small>{entry.correctCount}/5 discoveries</small></span><ChevronRight size={13} color="#887198" /></button>; })}</section></div>
        <aside className="arena-right" aria-label="Daily expedition and statistics"><section className="arena-daily"><div className="arena-daily-art"><Image src="/images/knowledge-kingdom.png" alt="" fill sizes="(max-width:760px) 100vw, 330px" /><span className="arena-daily-badge"><Crown size={11} />DAILY CHALLENGE</span></div><div className="arena-daily-copy"><h3 className="serif">{c.daily}</h3><p>{c.dailyHint}</p><div className="arena-daily-meta"><Clock3 size={11} />{c.dailyNote}</div><button disabled={pending || loading} className="arena-button gold" onClick={() => start(true)}>{overview?.dailyCompleted ? c.dailyAgain : c.dailyButton}<ArrowRight size={13} /></button><p className="!mt-2 text-center !text-[8px]">{c.dailyRewardNote}</p></div></section>
          <section className="arena-stats"><h3 className="serif">{c.journey}</h3><div className="arena-stat"><span><Trophy size={13} color="#c6a56d" />{c.recentBest}</span><strong>{best.toLocaleString()} <small className="text-[9px] text-[#7e6c8c]">pts</small></strong></div><div className="arena-stat"><span><Swords size={13} />{c.rounds}</span><strong>{historyCount}</strong></div><div className="arena-stat"><span><Target size={13} color="#91bcb1" />{c.accuracy}</span><strong>{historyCount ? Math.round(correctTotal / (historyCount * 5) * 100) : 0}%</strong></div><div className="mt-5 border-t border-white/5 pt-4 text-[9px] leading-5 text-[#80708e]">A little progress is still progress.<br />Your next discovery is one question away.</div></section></aside></div>
      </> : <section className="arena-round" aria-label="Knowledge Arena gameplay">
        <div className="arena-round-top"><button className="arena-back" disabled={pending} onClick={lobby}><ArrowLeft size={13} />{c.lobby}</button><span className="arena-pill"><CategoryIcon size={12} />{c.categories[round.config.category].short} · {c.difficulties[round.config.difficulty].name}</span></div>
        {round.phase === "results" ? <><div className="arena-result-hero"><motion.div initial={reduced ? false : { scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="arena-feedback-icon"><Trophy size={37} strokeWidth={1.3} /></motion.div><div className="arena-eyebrow">{c.resultEyebrow}</div><h2 ref={heading} tabIndex={-1} className="serif">{round.rank}</h2><p>{round.correctCount === 5 ? c.perfect : c.resultTitle}</p></div>
          <div className="arena-result-grid"><div><strong>{round.score.toLocaleString()}</strong><small>{c.score}</small></div><div><strong>{round.correctCount}/{round.total}</strong><small>Correct answers</small></div><div><strong>{round.authenticated ? `+${round.xpAwarded}` : `${Math.round(round.correctCount / round.total * 100)}%`}</strong><small>{round.authenticated ? c.xp : "Accuracy"}</small></div></div>
          <div className="arena-result-actions"><button disabled={pending} onClick={() => start(round.config.daily, round.config)} className="arena-button">{c.replay}<ArrowRight size={14} /></button><button className="arena-button secondary" onClick={lobby}>{c.changeRoute}<Compass size={14} /></button></div>
          <p className="arena-result-notice">{!round.authenticated ? <>{c.guestResult} <Link href="/signup" className="underline text-[#c5a4e4]">{c.signUp}</Link></> : round.config.daily && round.xpAwarded === 0 ? c.dailyNoReward : `${c.bestStreak}: ${round.bestStreak} · ${c.saved}`}</p>
          <h3 className="arena-review-heading serif">{c.review}</h3>{round.reviews.map((review, i) => <details className="arena-review" key={review.questionId}><summary>{review.correct ? <Check className="right" size={16} /> : <X className="wrong" size={16} />}<span>{i + 1}. {review.prompt}</span><small className="text-[#a48bb7]">+{review.points}</small><ChevronDown size={13} /></summary><div className="arena-review-body">{!review.correct && <p>{c.selected}: {review.selected ?? c.noAnswer}</p>}<p className="text-[#bad8ca]">{c.correctAnswer}: {review.answer}</p><p>{review.explanation}</p></div></details>)}</> : <>
          <div className="arena-round-info"><span><Sparkles size={14} />{round.score} {c.points}</span><span className={round.streak > 1 ? "text-[#dfb574]" : ""}><Flame size={14} />{round.streak} {c.streak.toLowerCase()}</span></div>
          <div className="arena-progress-track" aria-label={`Question ${round.index + 1} of ${round.total}`}>{Array.from({ length: round.total }, (_, i) => <span key={i} className={round.reviews[i] ? round.reviews[i].correct ? "answered" : "missed" : i === round.index ? "current" : ""} />)}</div>
          <motion.div key={`${round.index}-${round.phase}`} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }} className="arena-question-card">
          {round.phase === "question" && round.question ? <><div className="arena-question-header"><span className="arena-eyebrow">{c.question} {String(round.index + 1).padStart(2, "0")} / {String(round.total).padStart(2, "0")}</span><span className={`arena-clock ${round.deadline && clock.remaining <= 5 ? "urgent" : ""}`} aria-live="off"><Clock3 size={14} />{round.deadline ? `${clock.remaining}s` : "At your own pace"}</span></div><h2 ref={heading} tabIndex={-1} className="serif">{round.question.prompt}</h2><div className="arena-options" role="group" aria-label="Answer choices">{round.question.options.map((option, i) => <button key={option.id} className={`arena-option ${choice === option.id ? "selected" : ""}`} disabled={pending} aria-pressed={choice === option.id} onClick={() => setChoice(option.id)}><span>{String.fromCharCode(65 + i)}</span><span>{option.text}</span>{choice === option.id && <Check size={15} className="ml-auto shrink-0 text-[#bd91e2]" />}</button>)}</div><div className="arena-question-bottom"><p>{c.answerHint}</p><button className="arena-button" disabled={!choice || pending} onClick={() => answer(choice)}>{pending ? "Checking…" : c.confirm}<ArrowRight size={14} /></button></div></> : round.feedback ? <><div className={`arena-feedback-icon ${round.feedback.correct ? "" : "incorrect"}`}>{round.feedback.correct ? <Sparkles size={26} /> : round.feedback.timedOut ? <Clock3 size={25} /> : <BookOpen size={26} />}</div><div className="arena-question-header"><span className="arena-eyebrow">{c.question} {round.index + 1} / {round.total}</span><span className="arena-pill">+{round.feedback.points} {c.points}</span></div><h2 ref={heading} tabIndex={-1} className="serif">{round.feedback.correct ? c.correct : round.feedback.timedOut ? c.timeout : c.incorrect}</h2><div className="arena-answer-reveal"><small>{c.correctAnswer.toUpperCase()}</small><strong>{round.feedback.answer}</strong>{!round.feedback.correct && round.feedback.selected && <p className="mt-3 text-xs text-[#a38caa]">{c.selected}: {round.feedback.selected}</p>}</div><p className="arena-label">{c.explanation}</p><p className="arena-explanation">{round.feedback.explanation}</p><div className="arena-question-bottom"><p>{c.feedbackHint}</p><button disabled={pending} onClick={next} className="arena-button">{round.index === round.total - 1 ? c.results : c.next}<ArrowRight size={14} /></button></div></> : null}
          </motion.div><p className="arena-round-aside"><ShieldCheck size={12} />{c.saved}</p></>}
      </section>}
      <footer className="arena-footer"><span><Sparkles size={10} />{c.footer}</span><span>Crafted for curious minds. ✧ MindQuest</span></footer>
    </main></div><Guide dialogRef={guide} />
  </div>;
}
