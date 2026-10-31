import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "MindQuest — Small steps. Real growth.", template: "%s | MindQuest" }, description: "Turn your everyday goals into quests. Build momentum, earn XP, and grow one small step at a time." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
