"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
const subscribe = () => () => {};
const credentials = z.object({ email: z.email(), password: z.string().min(8).max(128) });
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = new FormData(event.currentTarget);
    const parsed = credentials.safeParse({ email: data.get("email"), password: data.get("password") });
    if (!parsed.success) { setError("Enter a valid email and a password of 8–128 characters."); return; }
    const name = String(data.get("name") ?? "").trim();
    if (signup && (name.length < 2 || name.length > 80)) { setError("Your name must be 2–80 characters."); return; }
    setPending(true);
    try {
      const result = signup ? await authClient.signUp.email({ ...parsed.data, name }) : await authClient.signIn.email(parsed.data);
      if (result.error) { setError(result.error.message ?? "Unable to sign in. Please try again."); return; }
      // A fresh document clears session-bound client caches after authentication.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/dashboard");
    } catch { setError("Unable to connect. Please try again shortly."); }
    finally { setPending(false); }
  }
  const inputClass = "mt-2 w-full rounded-xl border border-[#d5ddcf] bg-white px-4 py-3";
  return <form onSubmit={submit} className="mt-8 space-y-5">
    {signup && <label className="block text-sm font-semibold">Your name<input name="name" required minLength={2} maxLength={80} autoComplete="name" className={inputClass} /></label>}
    <label className="block text-sm font-semibold">Email<input name="email" type="email" required autoComplete="email" className={inputClass} /></label>
    <label className="block text-sm font-semibold">Password<input name="password" type="password" required minLength={8} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} className={inputClass} /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={pending || !hydrated} className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Please wait…" : signup ? "Create account" : "Log in"}</button>
    <p className="text-center text-sm text-[#6b786c]">{signup ? "Already an explorer?" : "New here?"} <Link href={signup ? "/login" : "/signup"} className="font-semibold text-primary underline">{signup ? "Log in" : "Create an account"}</Link></p>
  </form>;
}
