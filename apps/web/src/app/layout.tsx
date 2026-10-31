import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "MindQuest — Learn. Play. Level Up.", template: "%s | MindQuest" }, description: "An adventure for curious minds. Explore Knowledge Arena, discover something new, and level up through play." };
export const viewport: Viewport = { themeColor: "#100e1b", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
