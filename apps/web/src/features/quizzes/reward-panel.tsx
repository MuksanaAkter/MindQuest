"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Coins, Sparkles, Trophy } from "lucide-react";
import { AVATAR_EMOJI, type PlayerRewardSummary } from "@mindquest/server/quizzes/contracts";
import "./library.css";
export function RewardPanel({ reward }: { reward: PlayerRewardSummary }) {
  const reduced = useReducedMotion();
  const trophy = reward.trophy ?? reward.accuracy > 90;
  const unlocked = reward.unlockedAvatars ?? (reward.unlockedAvatar ? [reward.unlockedAvatar] : []);
  return <motion.section aria-label="Your quiz rewards" className="reward-earned-panel" initial={reduced ? false : { opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}><div className="quest-confetti" aria-hidden="true">✧ ✦ ⭐ ✦ ✧</div><div className="reward-badge">{trophy ? <Trophy size={22} className="mr-2 inline"/> : <Sparkles size={22} className="mr-2 inline"/>}{trophy ? "Above 90% Trophy" : reward.badge}</div><div className="reward-earnings">{reward.progression !== false && <><span><Sparkles size={17}/>+{reward.xp} XP</span><span><Coins size={17}/>+{reward.coins} coins</span></>}<span>{reward.accuracy}% correct</span></div>
    {trophy && <div className="reward-trophy"><span aria-hidden="true">🏆</span><h3>{reward.newTrophy ? "New trophy earned!" : "A trophy-worthy score!"}</h3><p>You scored above 90%. Your trophy is saved in My adventure. Each quiz adds one trophy to your collection.</p></div>}
    {reward.level > reward.previousLevel && <p role="status" className="reward-level-up">Level up! You’re now a level {reward.level} explorer. 🌟</p>}
    {unlocked.map(avatar => <div className="reward-unlock" key={avatar}><span aria-hidden="true">{AVATAR_EMOJI[avatar]}</span><strong>New avatar unlocked: {avatar}!</strong><p>Your new buddy is ready to choose on the homepage.</p></div>)}
    <p>{reward.progression === false ? "Your score is saved. Play library quizzes for XP and level-up avatars." : reward.newBest ? "A new personal best! Your virtual treasure is saved." : "You’ve earned rewards for this result already. Beat your best to grow your treasure."}<br/>Level {reward.level} · {reward.totalXp} total XP · {reward.totalCoins} coins</p>
  </motion.section>;
}
