"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, X } from "lucide-react";
import { BASE_AVATARS, AVATAR_EMOJI, type PublicQuiz } from "@mindquest/server/quizzes/contracts";
import { joinSchema } from "@mindquest/server/quizzes/validation";
import { QuestLoader } from "@/components/quest-loader";
import { unlockGameAudio } from "@/features/arena/game-audio";
import { quizApi } from "./api";
import { useLibrary } from "./library-store";
import { quizCopy as c } from "./copy";
import "./quiz.css";
const subscribe = () => () => {};
export function JoinForm({ quiz }: { quiz?: PublicQuiz }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const router = useRouter();
  const { quizzes, player, loading, error: libraryError, selectedCode: code, avatar, setCode, setAvatar, load } = useLibrary();
  const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  useEffect(() => {
    void load();
    const requested = new URLSearchParams(window.location.search).get("code");
    if (requested && !quiz) queueMicrotask(() => setCode(requested.toUpperCase().slice(0, 8)));
  }, [load, setCode, quiz]);
  async function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = joinSchema.safeParse({ name: new FormData(event.currentTarget).get("name"), avatar, code: quiz?.code ?? code });
    if (!data.success) { setError(c.invalidJoin); return; } setPending(true);
    unlockGameAudio();
    try { const result = await quizApi<{ attempt: { id: string } }>("/api/quizzes/join", data.data); router.push(`/play/${result.attempt.id}`); }
    catch (e) { setError(e instanceof Error ? e.message : c.unavailable); setPending(false); }
  }
  return <>{pending && <QuestLoader overlay label="Opening your quiz…"/>}<section id={quiz ? undefined : "join-quiz"} className="quiz-join" aria-labelledby={quiz ? "quiz-popup-title" : "join-title"}><h2 id={quiz ? "quiz-popup-title" : "join-title"} className="serif">{quiz ? "Ready, little explorer?" : c.joinTitle}</h2><p>{quiz ? "Add your name, pick a buddy, and let’s play!" : c.joinHint}</p>{quiz && <div className="quiz-popup-summary"><span aria-hidden="true">{quiz.icon ?? "✨"}</span><div><strong>{quiz.title}</strong><small>{quiz.questionCount} questions · {quiz.timed ? "15 seconds per question" : "Play at your own pace"}</small></div></div>}<form onSubmit={join}><fieldset disabled={!ready || pending}>
    {!quiz && quizzes.length > 0 && <label className="world-auth-label">{c.chooseQuiz}<select className="world-auth-input" value={quizzes.some((q) => q.code === code) ? code : ""} onChange={(event) => setCode(event.target.value)}><option value="">{c.selectQuiz}</option>{quizzes.map((q) => <option value={q.code} key={q.id}>{q.title} · {q.questionCount} questions</option>)}</select></label>}
    {!quiz && <><label className="world-auth-label">{c.code}<input name="code" className="world-auth-input quiz-code-input" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} required minLength={8} maxLength={8} autoComplete="off" spellCheck={false} /></label><p className="quiz-code-note">{loading ? "Loading published quizzes…" : libraryError ? "Could not load the list. You can still enter a shared code." : quizzes.length ? c.codeHint : c.noQuizzes}</p></>}
    <label className="world-auth-label">{c.name}<input name="name" defaultValue={player?.name !== "Explorer" ? player?.name : ""} className="world-auth-input" required minLength={2} maxLength={40} autoComplete="nickname" /></label>
    <fieldset className="mt-4"><legend className="world-auth-label !mt-0">{c.avatar}</legend><div className="quiz-avatars">{(player?.unlockedAvatars ?? [...BASE_AVATARS]).map((item) => <button key={item} type="button" aria-label={`${item} avatar`} aria-pressed={avatar === item} className={`quiz-avatar-choice ${avatar === item ? "selected" : ""}`} onClick={() => setAvatar(item)}><span aria-hidden="true">{AVATAR_EMOJI[item]}</span></button>)}</div></fieldset>
    {error && <p className="auth-error" role="alert">{error}</p>}<button disabled={pending} className="world-button">{pending ? c.joining : quiz ? "Let’s play!" : c.join}<ArrowRight size={15} /></button><p className="quiz-code-note flex items-center justify-center gap-1.5"><ShieldCheck size={12} />{c.noLogin}</p>
  </fieldset></form></section></>;
}

export function QuizJoinDialog({ quiz, onClose }: { quiz: PublicQuiz; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    element?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialog} className="quiz-join-dialog" aria-labelledby="quiz-popup-title" onClose={() => { if (!dialog.current?.open) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="quiz-popup-content"><button type="button" className="quiz-popup-close" aria-label="Close quiz popup" onClick={() => dialog.current?.close()}><X size={21}/></button><JoinForm quiz={quiz}/></div>
  </dialog>;
}
