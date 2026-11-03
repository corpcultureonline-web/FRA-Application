import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { after } from "next/server";
import logo from "@/assets/logo.png";
import { CONTACT_EMAIL } from "@/lib/company";
import { eventContext } from "@/lib/events/server";
import { TIERS } from "@/lib/pricing";
import { recordReportOpened, sentReport } from "@/lib/report/store";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { ReportView } from "./ReportView";
import styles from "./report.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: TIERS.report.name };

function Unknown() {
  const help = plain(t2("T2R-UNKNOWN-HELP"));
  const [before, after] = help.split(CONTACT_EMAIL);
  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
      </header>
      <main className={styles.main}>
        <div className={styles.cover}>
          <h1>{plain(t2("T2R-UNKNOWN-HEAD"))}</h1>
          <p className={styles.body}>{plain(t2("T2R-UNKNOWN-SUB"))}</p>
          <p className={styles.body}>
            {after === undefined ? (
              help
            ) : (
              <>
                {before}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                {after}
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * Screen 6, the Report page (Report library v1.8). Renders the approved
 * Report — the document frozen at submission with the reviewer's edits, never
 * re-assembled (§2, T70) — once it has been sent. Before that the personal
 * link shows Screen 5; a token we never issued gets the unknown-link page
 * (§9). `?print=1` is the view Chromium prints for the PDF.
 */
export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const report = await sentReport(token);
  if (report === "unknown") return <Unknown />;
  if (report === "pending") redirect(`/report/my/${token}`);

  const print = query.print === "1";
  if (!print) {
    const context = eventContext(await headers());
    const channel = query.ch === "email" || query.ch === "whatsapp" ? query.ch : null;
    after(() => recordReportOpened(context, report, channel));
  }
  return <ReportView doc={report.document} token={token} mode={print ? "print" : "page"} roadmapInterest={report.roadmapInterestAt !== null} />;
}
