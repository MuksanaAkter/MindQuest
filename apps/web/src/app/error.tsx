"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-3xl font-bold">Something went wrong.</h1><p className="my-5 text-[#6b786c]">Please try again. If this is a fresh installation, check your environment variables and database migrations.</p><button onClick={reset} className="mr-5 rounded-xl bg-primary px-5 py-3 text-white">Try again</button><Link href="/" className="underline">Back home</Link></main>;
}
