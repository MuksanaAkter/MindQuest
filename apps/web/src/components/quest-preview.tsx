"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, BookOpen, Leaf, Zap } from "lucide-react";
const quests = [{ title: "Read a few pages", detail: "Make room for a new perspective", icon: BookOpen }, { title: "Take a mindful break", detail: "Five minutes, just for yourself", icon: Leaf }, { title: "Learn something new", detail: "Let your curiosity lead the way", icon: Zap }];
export function QuestPreview() {
  const [completed, setCompleted] = useState<number[]>([]);
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl border border-[#dce4d8] bg-white p-6 shadow-xl shadow-green-950/5 sm:p-8">
    <div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.18em] text-primary">YOUR NEXT CHAPTER</p><h2 className="mt-2 text-2xl font-bold">A little better, every day.</h2></div><Sparkles className="shrink-0 text-[#c18a30]" /></div>
    <div className="mb-6 rounded-2xl bg-[#f0f4e9] p-5"><div className="mb-3 flex justify-between text-sm font-semibold"><span>Level 1 · Curious explorer</span><span aria-live="polite">{completed.length * 20} / 100 XP</span></div><div role="progressbar" aria-label="Demo XP" aria-valuenow={completed.length * 20} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-[#dce6d0]"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completed.length * 20}%` }} /></div></div>
    <div className="space-y-3">{quests.map((quest, index) => { const done = completed.includes(index); return <button key={quest.title} onClick={() => setCompleted(done ? completed.filter((id) => id !== index) : [...completed, index])} aria-pressed={done} className="flex w-full items-center gap-3 rounded-2xl border border-[#e4e8df] p-4 text-left transition-colors hover:bg-[#f8faf5]"><span className="rounded-xl bg-[#f1f4eb] p-3 text-primary"><quest.icon size={20} /></span><span className="flex-1"><span className={`block text-sm font-bold ${done ? 'line-through opacity-50' : ''}`}>{quest.title}</span><span className="mt-1 block text-xs text-[#6d7c72]">{quest.detail}</span></span><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${done ? 'border-primary bg-primary text-white' : 'border-[#ccd6c7]'}`}>{done && <Check size={15} />}</span></button>; })}</div>
    <p className="mt-5 text-center text-xs text-[#7b857b]">Try a quest above · This preview resets on reload</p>
  </motion.div>;
}
