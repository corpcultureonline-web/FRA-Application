import type { Metadata } from "next";
import { GoogleAdsTag } from "@/components/GoogleAdsTag";
import { ResultView } from "./ResultView";

export const metadata: Metadata = {
  title: "Your result",
  robots: { index: false },
};

export default function ResultPage() {
  return (
    <>
      <GoogleAdsTag />
      <ResultView />
    </>
  );
}
