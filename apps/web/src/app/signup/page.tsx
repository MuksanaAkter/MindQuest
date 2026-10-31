import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Sign up" };
export default function Page() { return <main className="mx-auto max-w-md px-6 py-12"><Logo /><div className="mt-16"><h1 className="text-3xl font-bold tracking-tight">Your adventure starts here.</h1><p className="mt-3 text-[#6b786c]">Make space for a little progress every day.</p><AuthForm mode="signup" /></div></main>; }
