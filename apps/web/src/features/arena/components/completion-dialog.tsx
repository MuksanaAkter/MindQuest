"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Trophy, X } from "lucide-react";
import type { ArenaView } from "@mindquest/server/arena/contracts";
import { QuizScoreboard } from "@/features/quizzes/scoreboard";
import "../completion-dialog.css";

export function CompletionDialog({ round }: { round: ArenaView }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    const previous = document.body.style.overflow;
    dialog.current?.showModal(); document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  const resultUrl = `/results/${round.id}`;
  return <><div className="completion-placeholder"><Trophy size={35}/><h2>Adventure complete!</h2><Link href={resultUrl}>View full result<ArrowRight size={16}/></Link></div><dialog ref={dialog} className="completion-dialog" aria-labelledby="completion-title" onClose={() => { if (!dialog.current?.open) router.replace(resultUrl); }}>
    <button className="completion-close" aria-label="Close results and open full result" onClick={() => dialog.current?.close()}><X size={19}/></button>
    <header><span aria-hidden="true">🏆</span><p>YOU DID IT, EXPLORER!</p><h2 id="completion-title">Adventure complete!</h2><p>{round.quiz?.participantName ?? "Explorer"}, here’s how you did.</p></header>
    <div className="completion-stats" aria-label="Your final score"><div><strong>{round.score.toLocaleString()}</strong><small>points</small></div><div><strong>{round.correctCount}/{round.total}</strong><small>correct</small></div><div><strong>{Math.round(round.correctCount / round.total * 100)}%</strong><small>accuracy</small></div></div>
    {round.playerReward && <p className="completion-treasure">+{round.playerReward.xp} XP · +{round.playerReward.coins} coins · {round.playerReward.badge}</p>}
    {round.quiz && <QuizScoreboard quizId={round.quiz.id}/>}
    <nav><Link href={resultUrl} className="completion-primary">View full result<ArrowRight size={15}/></Link><Link href="/library">Quiz library</Link></nav>
  </dialog></>;
}
