import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuditHeader } from "@/components/AuditHeader";
import { loadReport } from "@/lib/report";
import { ResultReport } from "../../result/ResultReport";

export const metadata: Metadata = {
  title: "Your result · Franchise Readiness Audit",
  robots: { index: false, follow: false },
};

/**
 * The result screen rebuilt from MySQL, for Chromium to print as the PDF
 * (/api/report/[token]). Same component as /audit/result, minus the
 * interactive bits; the token in the URL is the only access check.
 */
export default async function ReportPage({ params }: PageProps<"/audit/report/[token]">) {
  const { token } = await params;
  const result = await loadReport(token);
  if (!result) notFound();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-cream text-ink">
      <AuditHeader />
      <ResultReport result={result} />
    </div>
  );
}
