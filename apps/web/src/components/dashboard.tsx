"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Plus, LogOut, Flag } from "lucide-react";
import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { getLevel, getLevelProgress, QUEST_XP } from "@mindquest/server/game";
import { questSchema } from "@mindquest/server/validation";
import { useGameStore } from "@/stores/game-store";
type Quest = { id: string; title: string; description: string; difficulty: keyof typeof QUEST_XP; completed: boolean };
export function Dashboard({ name, totalXp, quests }: { name: string; totalXp: number; quests: Quest[] }) {
  const router = useRouter(); const reduced = useReducedMotion();
  const { questDialogOpen, setQuestDialogOpen } = useGameStore();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function createQuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = new FormData(event.currentTarget);
    const parsed = questSchema.safeParse(Object.fromEntries(data));
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setPending("create");
    try { const res = await fetch("/api/quests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      if (!res.ok) throw new Error("Could not create quest. Please try again.");
      setQuestDialogOpen(false); setNotice("Your new quest is ready."); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setPending(null); }
  }
  async function complete(id: string) {
    setPending(id); setError("");
    try { const res = await fetch(`/api/quests/${id}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("Could not complete quest. Please try again.");
      const result = await res.json(); setNotice(`Quest complete! +${result.awardedXp} XP`); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setPending(null); }
  }
  async function signOut() {
    setPending("logout"); setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      // Clear session-bound client caches after signing out.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }
    catch { setError("Unable to log out. Try again."); } finally { setPending(null); }
  }
  const inputClass = "mt-2 w-full rounded-xl border border-[#d5ddcf] bg-white p-3";
  return <div className="mx-auto max-w-4xl px-6"><header className="flex h-24 items-center justify-between border-b border-[#dfe5da]"><Logo /><button onClick={signOut} disabled={pending !== null} className="flex items-center gap-2 text-sm"><LogOut size={16} />Log out</button></header>
    <main className="py-12"><p className="text-xs font-bold tracking-widest text-primary">YOUR PERSONAL ADVENTURE</p><h1 className="mt-3 text-4xl font-bold">Keep growing, {name}.</h1><p className="mt-3 text-[#6b786c]">A small step today is progress worth celebrating.</p>
    <section aria-label="Your progress" className="my-8 rounded-2xl bg-primary p-6 text-white"><div className="flex justify-between font-bold"><span>Level {getLevel(totalXp)} explorer</span><span>{totalXp} total XP</span></div><div role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={getLevelProgress(totalXp)} className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-[#d4e6a9] transition-all" style={{ width: `${getLevelProgress(totalXp)}%` }} /></div><p className="mt-3 text-sm text-white/75">{100 - getLevelProgress(totalXp)} XP until your next level</p></section>
    <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Your quests</h2><button aria-expanded={questDialogOpen} aria-controls="new-quest" onClick={() => { setQuestDialogOpen(!questDialogOpen); setError(""); }} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white"><Plus size={16} />{questDialogOpen ? "Close form" : "New quest"}</button></div>
    {error && <p role="alert" className="my-4 text-red-700">{error}</p>}<p role="status" className="mb-4 text-sm text-primary">{notice}</p>
    {questDialogOpen && <form id="new-quest" onSubmit={createQuest} className="mb-6 space-y-4 rounded-2xl border border-[#dfe5da] bg-white p-6"><label className="block text-sm font-semibold">Quest title<input name="title" autoFocus required minLength={3} maxLength={100} className={inputClass} /></label><label className="block text-sm font-semibold">Description<textarea name="description" maxLength={500} className={inputClass} /></label><label className="block text-sm font-semibold">Difficulty<select name="difficulty" className={inputClass}><option value="EASY">Easy · 20 XP</option><option value="MEDIUM">Medium · 40 XP</option><option value="HARD">Hard · 60 XP</option></select></label><button disabled={pending !== null} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">{pending === "create" ? "Creating…" : "Create quest"}</button></form>}
    {quests.length === 0 ? <div className="rounded-2xl border border-dashed border-[#cdd8c6] p-12 text-center"><Flag className="mx-auto mb-4 text-primary" /><h3 className="font-bold">Every adventure starts with one quest.</h3><p className="mt-2 text-sm text-[#6b786c]">Add a small goal you can accomplish today.</p></div> : <div className="space-y-3">{quests.map((q) => <motion.article key={q.id} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between gap-4 rounded-2xl border border-[#dfe5da] bg-white p-5"><div><p className="text-xs font-bold text-primary">{q.difficulty} · {QUEST_XP[q.difficulty]} XP</p><h3 className={`mt-2 font-bold ${q.completed ? 'line-through opacity-60' : ''}`}>{q.title}</h3>{q.description && <p className="mt-1 text-sm text-[#6b786c]">{q.description}</p>}</div><button disabled={q.completed || pending !== null} onClick={() => complete(q.id)} className="flex shrink-0 items-center gap-2 rounded-full border border-[#d5ddcf] px-4 py-2 text-sm disabled:opacity-50">{q.completed ? <><Check size={16} />Done</> : pending === q.id ? "Saving…" : "Complete"}</button></motion.article>)}</div>}
    </main></div>;
}
