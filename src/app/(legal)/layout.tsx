import type { ReactNode } from "react";
import { tier2FontVariables } from "@/lib/tier2/fonts";

/**
 * The legal pages are shared by the Audit, the Report and the Roadmap, so they
 * sit at the app level, not under either product. They use the Tier 2 type,
 * scoped to these pages so the rest of the app is unaffected.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return <div className={`${tier2FontVariables} flex flex-1 flex-col`}>{children}</div>;
}
