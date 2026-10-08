import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { loadReport, originFromHeaders } from "@/lib/report";
import { ReportDocument } from "../ReportDocument";

export const metadata: Metadata = {
  title: "Your result · Franchise Readiness Audit",
  robots: { index: false, follow: false },
};

/**
 * The founder's result, rebuilt from MySQL — what they see after the audit,
 * and what Chromium prints for the PDF (/api/report/[token], with ?print=1).
 * The token in the URL is the only access check.
 */
export default async function ReportPage({ params, searchParams }: PageProps<"/audit/report/[token]">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const report = await loadReport(token);
  if (!report) notFound();

  const origin = originFromHeaders(await headers()) ?? "";
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <ReportDocument
        report={report}
        print={query.print === "1"}
        tier2Url={process.env.TIER2_URL?.trim() || undefined}
        liveUrl={`${origin}/audit/report/${token}`}
      />
    </div>
  );
}
