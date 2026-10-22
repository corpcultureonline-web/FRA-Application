import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import logo from "@/assets/logo.png";
import { resolveResumeLink } from "@/lib/payments/resume";
import { TIERS } from "@/lib/pricing";
import { isAnswered } from "@/lib/questionnaire/rules";
import { loadRun, questionnaireFor } from "@/lib/questionnaire/store";
import { plain, segments } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { Expired } from "./Expired";
import styles from "./resume.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: TIERS.report.name };

const fill = (copy: string, vars: Record<string, string>) =>
  copy.replace(/\{([^}]+)\}/g, (whole, name: string) => vars[name] ?? whole);

/**
 * Screen 7, Resume (library v1.1). One job: prove nothing was lost, then get
 * out of the way. It resolves against the order's state, not the link: a run
 * already submitted goes to Screen 5; a superseded link shows the expired
 * state, which sends a fresh link to the address on the order (§4).
 */
export default async function ResumePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await resolveResumeLink(token);
  if (!link) notFound();
  if (link.submitted) redirect(`/report/my/${link.personalToken}`);

  const header = (
    <header className={styles.bar}>
      <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
    </header>
  );

  if (!link.live) {
    return (
      <div className={styles.page}>
        {header}
        <Expired
          token={token}
          copy={{
            head: plain(t2("T2RS-EXPIRED-HEAD")),
            sub: plain(t2("T2RS-EXPIRED-SUB")),
            button: plain(t2("T2RS-EXPIRED-BTN")),
            sent: plain(t2("T2RS-EXPIRED-SENT")),
          }}
        />
      </div>
    );
  }

  const run = await loadRun(link.personalToken);
  if (!run) notFound();
  // Counts his own questions: 32 or 34 (HANDOFF §11, "the total is the brand's own").
  const { questions, screens, sections } = questionnaireFor(run);
  const answered = questions.filter((q) => isAnswered(q, run.answers[q.code])).length;
  const remaining = questions.length - answered;
  const byCode = new Map(questions.map((q) => [q.code, q]));
  const open = screens.find((s) => s.codes.some((code) => !isAnswered(byCode.get(code)!, run.answers[code])));
  const section = sections[(open?.section ?? sections.length) - 1];
  const continueHref = `/report/my/${link.personalToken}/questions${remaining ? "" : "?s=review"}`;

  return (
    <div className={styles.page}>
      {header}
      <main className={styles.main}>
        <h1>{fill(plain(t2("T2RS-HEAD")), { brand: link.brandName })}</h1>
        <p className={styles.safe}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="#231F20" />
            <path d="M7 12.4l3.2 3.1 6.8-7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {plain(t2("T2RS-SAFE"))}
        </p>
        <div className={styles.facts}>
          <p className={styles.progress}>
            {fill(plain(t2("T2RS-PROGRESS")), { n: String(answered), total: String(questions.length) })}
          </p>
          <p>
            {segments(fill(t2("T2RS-SECTION"), { "section name": section.name })).map((part, i) =>
              part.strong ? <b key={i}>{part.text}</b> : <span key={i}>{part.text}</span>,
            )}
          </p>
        </div>
        <div className={styles.go}>
          <Link className={styles.btn} href={continueHref}>
            {plain(t2("T2RS-CONTINUE"))}
            <svg width="16" height="11" viewBox="0 0 18 12" fill="none" aria-hidden="true">
              <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          {/* ceil(remaining × 0.5) minutes, minimum 1; hidden when all are answered (§3). */}
          {remaining > 0 && (
            <p className={styles.time}>
              {fill(plain(t2("T2RS-TIME")), { n: String(Math.max(1, Math.ceil(remaining * 0.5))) })}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
