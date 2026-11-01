"use client";
import type { RefObject } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Compass, Trophy, X } from "lucide-react";
import type { ArenaConfig, ArenaView } from "@mindquest/server/arena/contracts";
import { ResultCelebration } from "./game-effects";
import { SceneArt } from "@/features/public/scene-art";
import { RewardPanel } from "@/features/quizzes/reward-panel";
import { quizCopy as qc } from "@/features/quizzes/copy";
import { arenaCopy as c } from "../copy";
type Props = { round: ArenaView; heading: RefObject<HTMLHeadingElement | null>; pending: boolean; start: (daily?: boolean, requested?: ArenaConfig) => Promise<void>; lobby: () => void };
export function ArenaResults({ round, heading, pending, start, lobby }: Props) {
  const reduced = useReducedMotion();
  return <><div className="arena-result-hero"><SceneArt/><ResultCelebration/><motion.div initial={reduced ? false : { scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="arena-feedback-icon"><Trophy size={37} strokeWidth={1.3} /></motion.div><div className="arena-eyebrow">{c.resultEyebrow}</div><h2 ref={heading} tabIndex={-1} className="serif">{round.rank}</h2><p>{round.correctCount === round.total ? c.perfect : c.resultTitle}</p></div>
          <div className="arena-result-grid" role="group" aria-label="Your quiz score"><div><strong>{round.score.toLocaleString()}</strong><small>{c.score}</small></div><div><strong>{round.correctCount}/{round.total}</strong><small>{c.correctCount}</small></div><div><strong>{round.authenticated ? `+${round.xpAwarded}` : `${Math.round(round.correctCount / round.total * 100)}%`}</strong><small>{round.authenticated ? c.xp : c.accuracyLabel}</small></div></div>
          {round.playerReward && <RewardPanel reward={round.playerReward} />}
          <div className="arena-result-actions">{round.quiz ? <><Link href="/#join-quiz" className="arena-button">{qc.playAgain}<ArrowRight size={14}/></Link><Link href="/me" className="arena-button secondary">My adventure<Trophy size={14}/></Link></> : <><button disabled={pending} onClick={() => start(round.config.daily, round.config)} className="arena-button">{c.replay}<ArrowRight size={14} /></button><button className="arena-button secondary" onClick={lobby}>{c.changeRoute}<Compass size={14} /></button></>}</div>
          <p className="arena-result-notice">{round.quiz ? <>{round.quiz.participantName} · {round.quiz.library ? "Your result is saved in My adventure." : qc.resultSaved}</> : !round.authenticated ? <>{c.guestResult} <Link href="/signup" className="underline text-[#c5a4e4]">{c.signUp}</Link></> : round.config.daily && round.xpAwarded === 0 ? c.dailyNoReward : `${c.bestStreak}: ${round.bestStreak} · ${c.saved}`}</p>
          <h3 className="arena-review-heading serif">{c.review}</h3>{round.reviews.map((review, i) => <details className="arena-review" key={review.questionId} data-correct={review.correct}><summary><span className="sr-only">{review.correct ? "Correct: " : "Review: "}</span>{review.correct ? <Check className="right" size={16} /> : <X className="wrong" size={16} />}<span>{i + 1}. {review.prompt}</span><small className="arena-review-points">+{review.points}</small><ChevronDown size={13} /></summary><div className="arena-review-body">{!review.correct && <p className="arena-review-selected">{c.selected}: {review.selected ?? c.noAnswer}</p>}<p className="arena-review-answer">{c.correctAnswer}: {review.answer}</p><p>{review.explanation}</p></div></details>)}</>;
}
