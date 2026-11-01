"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ArrowLeft, BookOpen, Brain, Check, ChevronRight, Clock3, Compass, Crown, Flame, Leaf, LockKeyhole, ShieldCheck, Sparkles, Swords, Volume2, VolumeX, WandSparkles } from "lucide-react";
import type { ArenaConfig, ArenaOverview, ArenaView, Category } from "@mindquest/server/arena/contracts";
import { AVATAR_EMOJI, type Avatar } from "@mindquest/server/quizzes/contracts";
import { quizCopy as qc } from "@/features/quizzes/copy";
import "@/features/quizzes/quiz.css";
import { useLibrary } from "@/features/quizzes/library-store";
import { SceneArt } from "@/features/public/scene-art";
import { useArenaUi } from "./store";
import { arenaCopy as c } from "./copy";
import { ArenaLobby } from "./components/arena-lobby";
import { ArenaResults } from "./components/arena-results";
import { useGameAudio } from "./game-audio";
import { QuestLoader } from "@/components/quest-loader";
import { AnswerCelebration, QuestionTimer } from "./components/game-effects";
import { QUESTION_SECONDS } from "@mindquest/server/arena/scoring";
import { categoryIcons } from "./icons";
import "./arena.css";
import "@/features/quizzes/adventure.css";
import "./kids-game.css";
import "./quiz-viewport.css";


async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : c.networkError);
  return data as T;
}
function Guide({ dialogRef, participant = false }: { dialogRef: React.RefObject<HTMLDialogElement | null>; participant?: boolean }) {
  return <dialog ref={dialogRef} className="arena-dialog" aria-labelledby="arena-guide-title" onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}><h2 id="arena-guide-title" className="serif">{c.guideTitle}</h2><ol>{(participant ? ["Pick an answer, then press Lock in answer.", "Read the explanation and move to the next question.", "Finish to see your score and virtual prizes. Score above 90% to win a trophy. Earn library XP and level up to unlock avatars.", "Open My adventure to find all your previous games, levels and avatars. They stay saved in this browser."] : c.guideSteps).map((step) => <li key={step}>{step}</li>)}</ol><button className="arena-button" onClick={() => dialogRef.current?.close()}>{c.close}<ArrowRight size={14} /></button></dialog>;
}
export function Arena({ attemptId }: { attemptId?: string }) {
  const { config, setConfig, sound, toggleSound } = useArenaUi();
  const { play, unlock } = useGameAudio(sound);
  const libraryPlayer = useLibrary((state) => state.player);
  const libraryQuizzes = useLibrary((state) => state.quizzes);
  const loadLibrary = useLibrary((state) => state.load);
  useEffect(() => { if (attemptId) void loadLibrary(); }, [attemptId, loadLibrary]);
  const [overview, setOverview] = useState<ArenaOverview | null>(null);
  const [round, setRound] = useState<ArenaView | null>(null);
  const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true); const [choice, setChoice] = useState<string | null>(null);
  const [clock, setClock] = useState({ remaining: 0, elapsed: 0, questionId: "" });
  const guide = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null); const inFlight = useRef(false); const expiredFor = useRef<string | null>(null);
  const reduced = useReducedMotion();
  const lastTick = useRef("");
  const completedSound = useRef("");
  const loadOverview = useCallback(async () => {
    try { const data = await api<ArenaOverview>("/api/arena"); setOverview(data); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : c.networkError); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (attemptId) return;
    let cancelled = false;
    api<ArenaOverview>("/api/arena").then((data) => { if (!cancelled) setOverview(data); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : c.networkError); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attemptId]);
  const setView = useCallback((view: ArenaView) => { setRound(view); setChoice(null); setError(""); expiredFor.current = null; if (view.phase === "results") { if (attemptId) void loadLibrary(true); else void loadOverview(); } }, [loadOverview, attemptId, loadLibrary]);
  useEffect(() => {
    if (!attemptId) return;
    api<ArenaView>(`/api/arena/${attemptId}`).then(setView).catch((e: unknown) => setError(e instanceof Error ? e.message : c.networkError));
  }, [attemptId, setView]);
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
    if (selected) play("lock");
    try {
      const view = await api<ArenaView>(`/api/arena/${round.id}`, { action: "answer", questionId: round.question.id, choiceId: selected });
      setView(view); if (view.feedback) play(view.feedback.correct ? "correct" : view.feedback.timedOut ? "timeout" : "wrong");
    } catch (e) { setError(e instanceof Error ? e.message : c.networkError); }
    finally { inFlight.current = false; setPending(false); }
  }, [round, play, setView]);
  async function next() {
    if (!round?.feedback || inFlight.current) return;
    inFlight.current = true; setPending(true); setError("");
    play("next");
    try { setView(await api<ArenaView>(`/api/arena/${round.id}`, { action: "next", questionId: round.feedback.questionId })); }
    catch (e) { setError(e instanceof Error ? e.message : c.networkError); }
    finally { inFlight.current = false; setPending(false); }
  }
  function lobby() { if (attemptId) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/"); return;
  } setLoading(true); setRound(null); setChoice(null); setError(""); void loadOverview(); }
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
      if (event.repeat || pending || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || guide.current?.open) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < 4 && question.options[index]) { event.preventDefault(); setChoice(question.options[index].id); play("select"); }
      if (event.key === "Enter" && choice && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); void answer(choice); }
    }
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  }, [round, choice, pending, answer, play]);
  useEffect(() => {
    if (document.hidden || !sound || pending || error || round?.phase !== "question" || !round.deadline || !round.question || clock.questionId !== round.question.id || clock.remaining < 1) return;
    const tick = `${round.id}:${round.question.id}:${clock.remaining}`;
    if (lastTick.current !== tick) { lastTick.current = tick; play("tick"); }
  }, [clock, round, pending, error, sound, play]);
  useEffect(() => {
    if (round?.phase === "results" && completedSound.current !== round.id) {
      completedSound.current = round.id; play("complete");
    }
  }, [round, play]);
  function toggleGameSound() { unlock(); toggleSound(); }
  function selectChoice(id: string) { setChoice(id); play("select"); }
  const quizTitle = libraryQuizzes.find((quiz) => quiz.id === round?.quiz?.id)?.title ?? round?.quiz?.title ?? c.title;
  const showGuide = () => guide.current?.showModal();
  const currentCategory: Category = round?.config.category ?? config.category;
  const CategoryIcon = categoryIcons[currentCategory];
  return <div className={`arena-shell ${attemptId ? "participant-shell" : ""} ${round || attemptId ? "playful-arena" : ""} ${((round && round.phase !== "results") || (attemptId && !round)) ? "quiz-viewport" : ""}`}>
    {!attemptId && <aside className="arena-sidebar" aria-label={c.navigation}>
      <Link href="/" className="arena-brand"><span className="arena-brand-mark"><BookOpen size={23} strokeWidth={1.4} /></span>{c.brand}</Link><p className="arena-tagline">{c.tagline}</p>
      <p className="arena-nav-label">{c.adventure}</p>
      <button className="arena-nav-link active" onClick={lobby}><Swords size={17} />{c.title}<ChevronRight size={12} className="ml-auto" /></button>
      <Link href="/create" className="arena-nav-link"><Compass size={17} />{qc.create}</Link>
      <button className="arena-nav-link" onClick={showGuide}><BookOpen size={17} />{c.help}</button>
      <div className="arena-future"><p className="arena-nav-label">{c.other}</p>{c.future.map((name, i) => { const Icon = [WandSparkles, Brain, Leaf][i]; return <div className="arena-future-mode" key={name} title={c.futureHint}><Icon size={16} /><span>{name}</span><LockKeyhole size={11} /></div>; })}</div>
      <div className="arena-sidebar-bottom"><div className="arena-guide-card"><Sparkles size={20} color="#b598d7" /><p>{c.guideQuote}</p><button onClick={showGuide}>{c.help}<ArrowUpRight size={12} /></button></div><div className="arena-guest"><span className="arena-avatar"><Crown size={17} /></span><div><strong>{overview?.authenticated ? overview.name : c.guest}</strong><Link href={overview?.authenticated ? "/dashboard" : "/login"}>{overview?.authenticated ? `${overview.totalXp} XP · ${c.profile}` : c.legacyLink}</Link></div></div></div>
    </aside>}
    <div className="arena-content">{attemptId ? <header className="arena-topbar"><Link href="/" className="participant-home"><BookOpen size={18}/>MindQuest · Home</Link><div className="arena-top-actions"><span className="xp-tag"><Sparkles size={14}/>{round?.playerReward?.totalXp ?? libraryPlayer?.totalXp ?? 0} XP</span><button className="arena-icon-button" aria-label={c.help} onClick={showGuide}><BookOpen size={15}/></button><button className="arena-icon-button" aria-label={sound ? c.soundOn : c.soundOff} aria-pressed={sound} onClick={toggleGameSound}>{sound ? <Volume2 size={15}/> : <VolumeX size={15}/>}</button><Link href="/me" className="participant-profile"><span aria-hidden="true">{AVATAR_EMOJI[(round?.quiz?.avatar as Avatar) ?? libraryPlayer?.avatar ?? "owl"]}</span><span>My adventure</span></Link></div></header> : <header className="arena-topbar"><div className="arena-breadcrumb"><span>{c.realm}</span><ChevronRight size={11} /><span>{round?.quiz ? quizTitle : c.realmName}</span></div><div className="arena-top-actions"><span className="xp-tag"><Sparkles size={14} />{round?.quiz?.library ? round.playerReward?.totalXp ?? libraryPlayer?.totalXp ?? 0 : overview?.totalXp ?? 0} XP</span><button className="arena-icon-button" aria-label={c.help} onClick={showGuide}><BookOpen size={15} /></button><button className="arena-icon-button" aria-label={sound ? c.soundOn : c.soundOff} aria-pressed={sound} onClick={toggleGameSound}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}</button><Link href={overview?.authenticated ? "/dashboard" : "/login"} className="arena-avatar" aria-label={overview?.authenticated ? c.dashboard : c.signIn}><Crown size={16} /></Link></div></header>}
    <main className="arena-main">
      {error && <div role="alert" className="arena-alert"><span>{error}</span><button className="arena-button secondary" disabled={pending} onClick={() => round ? resume(round.id) : attemptId ? resume(attemptId) : void loadOverview()}>{round ? c.recover : c.retry}</button></div>}
      {!round && attemptId ? <div className="arena-loading">{error ? <Link href="/">Back home</Link> : <QuestLoader label="Opening your quiz…"/>}</div> : !round ? <ArenaLobby overview={overview} config={config} loading={loading} pending={pending} setConfig={setConfig} start={start} resume={resume} /> : <section className="arena-round" aria-label="Knowledge Arena gameplay"><h1 className="sr-only">{quizTitle}</h1>{round.quiz && <div className="participant-banner"><SceneArt className="participant-scene"/><span aria-hidden="true">{AVATAR_EMOJI[round.quiz.avatar as Avatar]}</span><div><strong>{quizTitle}</strong><small>{round.quiz.participantName} · {qc.player}</small></div></div>}
        <div className="arena-round-top"><button className="arena-back" disabled={pending} onClick={lobby}><ArrowLeft size={13} />{c.lobby}</button><span className="arena-pill"><CategoryIcon size={12} />{round.quiz ? `${round.total} questions` : `${c.categories[round.config.category].short} · ${c.difficulties[round.config.difficulty].name}`}</span></div>
        {round.phase === "results" ? <ArenaResults round={round} heading={heading} pending={pending} start={start} lobby={lobby} /> : <>
          <div className="arena-round-info"><span><Sparkles size={14} />{round.score} {c.points}</span><span className={round.streak > 1 ? "text-[#dfb574]" : ""}><Flame size={14} />{round.streak} {c.streak.toLowerCase()}</span></div>
          <div className="arena-progress-track" aria-label={`Question ${round.index + 1} of ${round.total}`}>{Array.from({ length: round.total }, (_, i) => <span key={i} className={round.reviews[i] ? round.reviews[i].correct ? "answered" : "missed" : i === round.index ? "current" : ""} />)}</div>
          <motion.div key={`${round.index}-${round.phase}`} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }} className="arena-question-card">
          <div className="arena-question-body">{round.phase === "question" && round.question ? <><div className="arena-question-header"><span className="arena-eyebrow">{c.question} {String(round.index + 1).padStart(2, "0")} / {String(round.total).padStart(2, "0")}</span>{round.deadline ? <QuestionTimer remaining={clock.questionId === round.question.id ? clock.remaining : Math.max(0, Math.ceil((new Date(round.deadline).getTime() - new Date(round.serverTime).getTime()) / 1000))} duration={QUESTION_SECONDS[round.config.difficulty]}/> : <span className="arena-clock"><Clock3 size={14}/>{c.ownPace}</span>}</div><h2 ref={heading} tabIndex={-1} className="serif">{round.question.prompt}</h2><div className="arena-options" role="group" aria-label={c.answerChoices}>{round.question.options.map((option, i) => <button key={option.id} className={`arena-option option-color-${i} ${choice === option.id ? "selected" : ""}`} disabled={pending} aria-pressed={choice === option.id} onClick={() => selectChoice(option.id)}><span>{String.fromCharCode(65 + i)}</span><span>{option.text}</span>{choice === option.id && <Check size={15} className="ml-auto shrink-0 text-[#bd91e2]" />}</button>)}</div></> : round.feedback ? <><AnswerCelebration correct={round.feedback.correct} timedOut={round.feedback.timedOut} points={round.feedback.points} streak={round.streak} mascot={AVATAR_EMOJI[(round.quiz?.avatar as Avatar) ?? "owl"]}/><div className="arena-question-header"><span className="arena-eyebrow">{c.question} {round.index + 1} / {round.total}</span><span className="arena-pill">+{round.feedback.points} {c.points}</span></div><h2 ref={heading} tabIndex={-1} className="serif">{round.feedback.correct ? c.correct : round.feedback.timedOut ? c.timeout : c.incorrect}</h2><div className="arena-answer-reveal"><small>{c.correctAnswer.toUpperCase()}</small><strong>{round.feedback.answer}</strong>{!round.feedback.correct && round.feedback.selected && <p className="mt-3 text-xs text-[#a38caa]">{c.selected}: {round.feedback.selected}</p>}</div><p className="arena-label">{c.explanation}</p><p className="arena-explanation">{round.feedback.explanation}</p></> : null}</div>
          <div className="arena-question-bottom"><p>{round.phase === "question" ? c.answerHint : c.feedbackHint}</p><button className="arena-button" disabled={pending || (round.phase === "question" && !choice)} onClick={() => round.phase === "question" ? void answer(choice) : void next()}>{pending ? <><span className="quest-button-spinner" aria-hidden="true"/>{round.phase === "question" ? c.checking : "Opening…"}</> : round.phase === "question" ? c.confirm : round.index === round.total - 1 ? c.results : c.next}<ArrowRight size={14}/></button></div>
          </motion.div><p className="arena-round-aside"><ShieldCheck size={12} />{c.saved}</p></>}
      </section>}
      <footer className="arena-footer"><span><Sparkles size={10} />{c.footer}</span><span>{c.footerCredit}</span></footer>
    </main></div><Guide dialogRef={guide} participant={Boolean(attemptId)} />
  </div>;
}
