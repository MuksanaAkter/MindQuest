import Link from "next/link";
import { Sprout } from "lucide-react";
export function Logo() {
  return <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight"><span className="rounded-xl bg-primary p-2 text-white"><Sprout size={23} /></span>MindQuest<span className="text-primary">.</span></Link>;
}
