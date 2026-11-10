import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GoogleTag } from "@/components/GoogleTag";
import { tier2FontVariables } from "@/lib/tier2/fonts";

/** The Report's screens: Tier 2 type, and out of search like every funnel route (T4, T17). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ReportLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${tier2FontVariables} flex flex-1 flex-col`}>
      {/* Analytics only; the tag stays off in the PDF's print view on its own. */}
      <GoogleTag ads={false} />
      {children}
    </div>
  );
}
