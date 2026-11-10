import type { Metadata } from "next";
import { GoogleTag } from "@/components/GoogleTag";
import { ResultView } from "./ResultView";

export const metadata: Metadata = {
  title: "Your result",
  robots: { index: false },
};

export default function ResultPage() {
  return (
    <>
      <GoogleTag />
      <ResultView />
    </>
  );
}
