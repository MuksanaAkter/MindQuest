"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { publicCopy as c } from "@/features/public/copy";
import { authClient } from "@/lib/auth-client";
const subscribe = () => () => {};
const credentials = z.object({ email: z.email(), password: z.string().min(8).max(128) });
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = new FormData(event.currentTarget);
    const parsed = credentials.safeParse({ email: data.get("email"), password: data.get("password") });
    if (!parsed.success) { setError(c.invalidCredentials); return; }
    const name = String(data.get("name") ?? "").trim();
    if (signup && (name.length < 2 || name.length > 80)) { setError(c.invalidName); return; }
    setPending(true);
    try {
      const result = signup ? await authClient.signUp.email({ ...parsed.data, name }) : await authClient.signIn.email(parsed.data);
      if (result.error) { setError(result.error.message ?? c.failed); return; }
      // A fresh document clears session-bound client caches after authentication.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/create");
    } catch { setError(c.unavailable); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="world-auth-form"><fieldset disabled={!hydrated || pending}>
    {signup && <label className="world-auth-label">{c.name}<input name="name" required minLength={2} maxLength={80} autoComplete="name" className="world-auth-input" /></label>}
    <label className="world-auth-label">{c.email}<input name="email" type="email" required autoComplete="email" className="world-auth-input" /></label>
    <label className="world-auth-label" htmlFor="auth-password">{c.password}</label><div className="auth-password-wrap"><input id="auth-password" name="password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} className="world-auth-input" /><button type="button" className="auth-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
    {signup && <p className="auth-hint">{c.passwordHint}</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    <button disabled={pending || !hydrated} className="world-button">{pending ? c.pending : signup ? c.signupButton : c.loginButton}<ArrowRight size={15} /></button>
    <p className="auth-switch">{signup ? c.existing : c.new}<Link href={signup ? "/login" : "/signup"}>{signup ? c.login : c.create}</Link></p>
    <Link href="/#join-quiz" className="auth-guest-link">{c.guest}<ArrowRight size={12} /></Link>
    <p className="auth-hint text-center !mt-3">{c.guestHint}</p>
  </fieldset></form>;
}
