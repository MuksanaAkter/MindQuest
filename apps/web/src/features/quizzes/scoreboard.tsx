"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Trophy, X } from "lucide-react";
import { AVATAR_EMOJI, type QuizScoreboard as Scores } from "@mindquest/server/quizzes/contracts";
import { quizApi } from "./api";
import "./scoreboard.css";

export function QuizScoreboard({ quizId }: { quizId: string }) {
  const [scores, setScores] = useState<Scores | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const inFlight = useRef(true);
  const load = useCallback(async (page = 0) => {
    if (inFlight.current) return;
    inFlight.current = true; setPending(true); setError("");
    try {
      const result = await quizApi<Scores>(`/api/quizzes/${quizId}/scoreboard?page=${page}`);
      setScores((previous) => ({ ...result, entries: page && previous ? [...previous.entries, ...result.entries.filter((row) => !previous.entries.some((old) => old.rank === row.rank))] : result.entries }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load scores. Try again."); }
    finally { inFlight.current = false; setPending(false); }
  }, [quizId]);
  useEffect(() => {
    let cancelled = false;
    quizApi<Scores>(`/api/quizzes/${quizId}/scoreboard?page=0`)
      .then((result) => { if (!cancelled) setScores(result); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load scores. Try again."); })
      .finally(() => { if (!cancelled) { inFlight.current = false; setPending(false); } });
    return () => { cancelled = true; };
  }, [quizId]);
  // Keep the list keyboard-scrollable, including on narrow phones.
  return <section className="quiz-scoreboard" aria-label="Quiz scoreboard">
    <div className="scoreboard-heading"><div><span className="scoreboard-icon"><Trophy size={21}/></span><div><h2>Quiz scoreboard</h2><p>Your best finished run counts</p></div></div><button type="button" className="scoreboard-refresh" disabled={pending} aria-label="Refresh scoreboard" onClick={() => void load()}><RefreshCw size={16} className={pending ? "is-spinning" : ""}/></button></div>
    <div className="scoreboard-caption"><span>{scores ? `${scores.total} ${scores.total === 1 ? "explorer" : "explorers"}` : "Gathering explorers…"}</span><span>Score · Level</span></div>
    {error && <p className="scoreboard-message" role="alert">{error}</p>}
    {!scores && pending ? <p className="scoreboard-message" role="status">Opening the scoreboard…</p> : scores && !scores.entries.length ? <p className="scoreboard-message">Be the first to finish this quiz! 🌟</p> : null}
    {scores && scores.entries.length > 0 && <div className="scoreboard-scroll" tabIndex={0} role="region" aria-label="Ranked explorers"><ol>{scores.entries.map((entry) => <li key={entry.rank} className={entry.isYou ? "scoreboard-you" : ""}><span className={`scoreboard-rank rank-${entry.rank}`}>{entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}</span><span className="scoreboard-avatar" aria-hidden="true">{AVATAR_EMOJI[entry.avatar]}</span><div className="scoreboard-player"><strong>{entry.name}{entry.isYou && <em>You</em>}</strong><small>Level {entry.level}</small></div><strong className="scoreboard-score">{entry.score.toLocaleString()}<small>points</small></strong></li>)}</ol>{scores.nextPage !== null && <button className="scoreboard-more" disabled={pending} onClick={() => void load(scores.nextPage!)}>{pending ? "Loading…" : "More explorers"}</button>}</div>}
  </section>;
}

export function ScoreboardDialog({ quizId, onClose }: { quizId: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    dialog.current?.showModal(); document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={dialog} className="scoreboard-dialog" aria-label="Quiz scoreboard" onClose={() => { if (!dialog.current?.open) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}><button className="scoreboard-close" aria-label="Close scoreboard" onClick={() => dialog.current?.close()}><X size={20}/></button><QuizScoreboard quizId={quizId}/></dialog>;
}
