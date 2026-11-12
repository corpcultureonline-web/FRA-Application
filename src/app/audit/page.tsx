import type { Metadata } from "next";
import { ClarityTag } from "@/components/ClarityTag";
import { GoogleTag } from "@/components/GoogleTag";
import { AuditFlow } from "./AuditFlow";

export const metadata: Metadata = {
  title: "Free audit",
  description: "11 questions. About 4 minutes. Free, with no signup.",
  robots: { index: false },
};

export default function AuditPage() {
  return (
    <>
      <GoogleTag />
      <ClarityTag />
      <AuditFlow />
    </>
  );
}
