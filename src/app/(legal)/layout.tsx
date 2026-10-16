import type { ReactNode } from "react";
import { DM_Mono, DM_Sans, Lexend } from "next/font/google";

/**
 * The legal pages are shared by the Audit, the Report and the Roadmap, so they
 * sit at the app level, not under either product. They use the Tier 2 type
 * (handoff v2.1 tokens: Lexend, DM Sans, DM Mono), scoped to these pages so the
 * rest of the app is unaffected.
 */
const lexend = Lexend({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-lexend" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-dm-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: "400", variable: "--font-dm-mono" });

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${lexend.variable} ${dmSans.variable} ${dmMono.variable} flex flex-1 flex-col`}>{children}</div>
  );
}
