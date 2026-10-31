import { WorldBrand } from "@/features/public/brand";
import "@/features/public/public.css";
export default function Loading() {
  return <main className="public-world min-h-screen px-6 py-20" role="status"><div className="mx-auto max-w-4xl"><WorldBrand/><p className="!mt-8 animate-pulse text-sm text-[#c5a7e4]">Opening your creator dashboard…</p><div aria-hidden="true" className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">{[0,1,2,3].map(item=><div key={item} className="h-32 animate-pulse rounded-2xl border border-[#ad8ac72b] bg-[#39234835]"/>)}</div></div></main>;
}
