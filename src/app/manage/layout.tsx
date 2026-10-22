import type { Metadata } from "next";
import type { ReactNode } from "react";
import { tier2FontVariables } from "@/lib/tier2/fonts";

/** The review panel (Screens 8–9): never indexed, linked from nowhere (Admin §8). */
export const metadata: Metadata = {
  title: "Corporate Culture review",
  robots: { index: false, follow: false },
};

export default function ManageLayout({ children }: { children: ReactNode }) {
  return <div className={`${tier2FontVariables} flex flex-1 flex-col`}>{children}</div>;
}
