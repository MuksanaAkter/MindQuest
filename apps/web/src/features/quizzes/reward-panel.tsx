"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Coins, Sparkles, Trophy } from "lucide-react";
import { AVATAR_EMOJI, type PlayerRewardSummary } from "@mindquest/server/quizzes/contracts";
import "./library.css";
export function RewardPanel({ reward }: { reward: PlayerRewardSummary }) {
  const reduced = useReducedMotion();
  return <motion.section aria-label="Your quiz rewards" className="reward-earned-panel" initial={reduced ? false : { opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}><div className="quest-confetti" aria-hidden="true">✧ ✦ ⭐ ✦ ✧</div><div className="reward-badge"><Trophy size={22} className="mr-2 inline"/>{reward.badge}</div><div className="reward-earnings"><span><Sparkles size={17}/>+{reward.xp} XP</span><span><Coins size={17}/>+{reward.coins} coins</span><span>{reward.accuracy}% correct</span></div>{reward.level > reward.previousLevel && <p role="status" className="reward-level-up">Level up! You’re now a level {reward.level} explorer. 🌟</p>}
    {reward.unlockedAvatar && <div className="reward-unlock"><span aria-hidden="true">{AVATAR_EMOJI[reward.unlockedAvatar]}</span><strong>New avatar unlocked: {reward.unlockedAvatar}!</strong><p>You scored above 90%. Your new buddy is ready to choose on the homepage.</p></div>}
    <p>{reward.newBest ? "A new personal best! Your virtual treasure is saved." : "You’ve earned rewards for this result already. Beat your best to grow your treasure."}<br/>Level {reward.level} · {reward.totalXp} total XP · {reward.totalCoins} coins</p>
  </motion.section>;
}
