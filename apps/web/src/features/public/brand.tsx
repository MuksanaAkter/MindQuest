import Link from "next/link";
import { BookOpen } from "lucide-react";
import { publicCopy as c } from "./copy";
export function WorldBrand() { return <Link href="/" className="world-brand"><span><BookOpen size={23} strokeWidth={1.4} /></span>{c.brand}</Link>; }
