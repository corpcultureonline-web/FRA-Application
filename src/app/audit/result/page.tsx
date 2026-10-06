import type { Metadata } from "next";
import { ResultView } from "./ResultView";

export const metadata: Metadata = {
  title: "Your result · Franchise Readiness Audit",
  robots: { index: false },
};

export default function ResultPage() {
  return <ResultView />;
}
