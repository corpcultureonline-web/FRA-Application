import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClarityTag } from "@/components/ClarityTag";
import { GoogleTag } from "@/components/GoogleTag";
import { tier2FontVariables } from "@/lib/tier2/fonts";

/** The Report's screens: Tier 2 type, and out of search like every funnel route (T4, T17). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ReportLayout({ children }: { children: ReactNode }) {
  return (
    // Every screen of the paid Report is masked whole in Clarity's recordings: text and inputs (ClarityTag).
    <div data-clarity-mask="true" className={`${tier2FontVariables} flex flex-1 flex-col`}>
      {/* Analytics only; both tags stay off in the PDF's print view on their own. */}
      <GoogleTag ads={false} />
      <ClarityTag />
      {children}
    </div>
  );
}
