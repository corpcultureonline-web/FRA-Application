import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TIERS } from "@/lib/pricing";
import { notFound } from "next/navigation";
import logo from "@/assets/logo.png";
import { Rich } from "@/components/Rich";
import { WHATSAPP_URL } from "@/lib/company";
import { delivery } from "@/lib/payments/delivery";
import { paidRun } from "@/lib/payments/orders";
import { AUDIT_EMAIL_ERROR } from "@/lib/tier2/live-strings";
import { loadReport } from "@/lib/report";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { Submitted, type SubmittedCopy } from "./Submitted";
import styles from "./told.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: TIERS.report.name };

/** "*{mobile}* on WhatsApp" → "{mobile} on WhatsApp": the library marks the placeholder in italics. */
const unitalic = (copy: string) => plain(copy).replace(/\*/g, "");

function submittedCopy(): SubmittedCopy {
  const p = (key: string) => plain(t2(key));
  return {
    head: p("T2S-HEAD"),
    sub: p("T2S-SUB"),
    reviewer: p("T2S-REVIEWER"),
    when: p("T2S-WHEN"),
    still: p("T2S-STILL"),
    whereLabel: p("T2S-WHERE-LABEL"),
    wherePhone: unitalic(t2("T2S-WHERE-PHONE")),
    change: p("T2S-CHANGE"),
    closeOk: p("T2S-CLOSE-OK"),
    emailLabel: p("T2S-CHANGE-EMAIL-LABEL"),
    phoneLabel: p("T2S-CHANGE-PHONE-LABEL"),
    save: p("T2S-CHANGE-SAVE"),
    cancel: p("T2S-CHANGE-CANCEL"),
    done: p("T2S-CHANGE-DONE"),
    phoneErr: p("T2S-PHONE-ERR"),
    emailErr: AUDIT_EMAIL_ERROR,
    a11yEmail: p("T2S-CHANGE-A11Y-EMAIL"),
    a11yPhone: p("T2S-CHANGE-A11Y-PHONE"),
    readyHead: p("T2S-READY-HEAD"),
    readyBtn: p("T2S-READY-BTN"),
    entity: p("T2C-ENTITY"),
  };
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="#F0E6D8" />
      <path d="M4.8 8.2l2.1 2.1 4.3-4.4" stroke="#231F20" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The personal link (CANONICAL-VALUES §4), one URL for the whole paid run:
 * Screen 3 until he submits, then Screen 5 — waiting, or "Your Report is
 * ready" once it is sent (Submitted §4).
 *
 * Screen 3, "What you already told us" (Carried library v1.2): his Audit
 * answers restated, his range, and the way into the questions.
 *
 * The restatements are the Audit result page's own strings, from the same
 * build (buildReport), so the two pages cannot say different things. The
 * screen is read-only; a wrong answer is flagged to the team (option B).
 */
export default async function PersonalLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const run = await paidRun(token);
  if (!run) notFound();

  if (run.submittedAt) {
    const where = await delivery(run.orderId);
    if (!where) notFound();
    return (
      <Submitted
        token={token}
        arrived={query.from === "finish"}
        ready={where.reportSentAt !== null}
        email={where.email}
        mobile={where.mobile}
        copy={submittedCopy()}
      />
    );
  }
  const audit = await loadReport(run.auditToken);
  if (!audit) notFound();

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.intro}>
            <h1>{plain(t2("T2W-HEAD"))}</h1>
            <p className={styles.sub}>{plain(t2("T2W-SUB"))}</p>
          </div>

          <ul className={styles.told}>
            {audit.content.toldUs.map((line, i) => (
              <li key={i}>
                <Check />
                <span>
                  <Rich text={line} strongClass="" />
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.range}>
            <span className={styles.rangeLabel}>{plain(t2("T2W-RANGE-LABEL"))}</span>
            <span className={styles.rangeValue}>
              {audit.range.low} – {audit.range.high}
            </span>
            <span className={styles.rangeNote}>{plain(t2("T2W-RANGE-NOTE"))}</span>
          </div>

          <p className={styles.fix}>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              {plain(t2("T2W-FIX"))}
            </a>
          </p>

          <div className={styles.act}>
            <Link className={styles.start} href={`/report/my/${token}/questions`}>
              <span>{plain(t2("T2W-START"))}</span>
              <svg width="16" height="11" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className={styles.time}>{plain(t2("T2W-TIME"))}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
