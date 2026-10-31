"use client";
import { useEffect, type CSSProperties } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Check, Clock3, Sparkles } from "lucide-react";
import "../game-effects.css";

export function QuestionTimer({ remaining, duration }: { remaining: number; duration: number }) {
  const seconds = Math.max(0, remaining);
  const fraction = Math.min(1, Math.max(0, seconds / duration));
  return <div className={`question-countdown ${seconds <= 5 ? "is-urgent" : ""}`} role="timer" aria-label={`${seconds} seconds remaining`}>
    <svg viewBox="0 0 72 72" aria-hidden="true"><circle className="countdown-track" cx="36" cy="36" r="30"/><circle className="countdown-fill" cx="36" cy="36" r="30" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - fraction * 100}/></svg>
    <div><strong>{seconds}</strong><small>SECONDS</small></div>
  </div>;
}
export function AnswerCelebration({ correct, timedOut, points, streak }: { correct: boolean; timedOut: boolean; points: number; streak: number }) {
  const reduced = useReducedMotion();
  const count = useMotionValue(reduced ? points : 0);
  const display = useTransform(count, value => `+${Math.round(value)}`);
  useEffect(() => {
    const animation = animate(count, points, { duration: reduced ? 0 : .65, ease: "easeOut" });
    return () => animation.stop();
  }, [count, points, reduced]);
  return <div className={`answer-celebration ${correct ? "celebration-correct" : "celebration-learning"}`} role="status" aria-label={correct ? `Correct! ${points} points earned${streak > 1 ? `, ${streak} answer streak` : ""}.` : timedOut ? "Time’s up. Let’s learn the answer." : "Keep going! Let’s learn the answer."}>
    {correct && <div className="answer-confetti" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{"--angle":`${i*22.5}deg`,"--distance":`${75+(i%3)*24}px`,"--delay":`${i%4*.035}s`,"--piece-color":["#cba4fa","#ffd377","#8fe2bc","#edabc7"][i%4]} as CSSProperties}/>)}</div>}
    <motion.div className="answer-effect-icon" initial={reduced ? false : { scale: .35, rotate: -18 }} animate={reduced ? { scale:1 } : correct ? { scale:[.35,1.18,1],rotate:[-18,7,0] } : { scale:1,rotate:[0,-9,9,-5,5,0] }} transition={{duration:.55}} aria-hidden="true">{correct ? <Check size={35} strokeWidth={3}/> : timedOut ? <Clock3 size={32}/> : <Sparkles size={32}/>}</motion.div>
    <motion.div className="answer-score-pop" initial={reduced ? false : { opacity:0,y:14,scale:.8 }} animate={{opacity:1,y:0,scale:1}} transition={{delay:reduced ? 0 : .15,type:"spring",stiffness:250,damping:18}} aria-hidden="true"><motion.strong>{display}</motion.strong><span>points</span>{streak > 1 && <small>🔥 {streak} in a row!</small>}</motion.div>
  </div>;
}
export function ResultCelebration() {
  return <div className="result-celebration" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{"--x":`${3+i*4}%`,"--delay":`${i%6*.12}s`,"--turn":`${i%2 ? 240 : -240}deg`,"--piece-color":["#d6b0ff","#ffe295","#a3e4ce","#f6afce"][i%4]} as CSSProperties}/>)}</div>;
}
