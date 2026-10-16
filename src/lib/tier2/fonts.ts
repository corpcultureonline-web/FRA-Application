import { DM_Mono, DM_Sans, Lexend } from "next/font/google";

/**
 * The Tier 2 type (handoff v2.1 tokens: Lexend, DM Sans, DM Mono), as CSS
 * variables on a wrapper, so it applies to the Report's screens and the legal
 * pages without changing the Audit's.
 */
const lexend = Lexend({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-lexend" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: "400", variable: "--font-dm-mono" });

export const tier2FontVariables = `${lexend.variable} ${dmSans.variable} ${dmMono.variable}`;
