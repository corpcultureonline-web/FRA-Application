import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { eventContext, logResultViewed } from "@/lib/events/server";
import { loadReport, originFromHeaders, reportExists } from "@/lib/report";
import { ReportDocument } from "../ReportDocument";
import { ResultPage } from "../ResultPage";

export const metadata: Metadata = {
  title: "Your result",
  robots: { index: false, follow: false },
};

/**
 * The founder's result, rebuilt from MySQL. On screen it is the result page
 * they land on after the audit; with ?print=1 it is the PDF layout Chromium
 * prints (/api/report/[token]). Both read the same ReportData.
 * The token in the URL is the only access check.
 */
export default async function ReportPage({ params, searchParams }: PageProps<"/audit/report/[token]">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const report = await loadReport(token);
  if (!report) notFound();

  const requestHeaders = await headers();
  const tier2Url = process.env.TIER2_URL?.trim() || undefined;
  if (query.print !== "1") {
    // Event log: logged after the response, never delaying the page. The print
    // view is Chromium rendering the PDF, not a founder reading, so it is skipped.
    const context = eventContext(requestHeaders);
    after(async () => {
      const submission = await reportExists(token);
      if (submission) await logResultViewed(context, submission.id);
    });
    return <ResultPage report={report} tier2Url={tier2Url} />;
  }

  const origin = originFromHeaders(requestHeaders) ?? "";
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <ReportDocument
        report={report}
        print
        tier2Url={tier2Url}
        liveUrl={`${origin}${withBasePath(`/audit/report/${token}`)}`}
      />
    </div>
  );
}
