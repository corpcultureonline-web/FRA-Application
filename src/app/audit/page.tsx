import type { Metadata } from "next";
import { AuditFlow } from "./AuditFlow";

export const metadata: Metadata = {
  title: "Free audit · Franchise Readiness Audit",
  description: "11 questions. About 4 minutes. Free, with no signup.",
  robots: { index: false },
};

export default function AuditPage() {
  return <AuditFlow />;
}
