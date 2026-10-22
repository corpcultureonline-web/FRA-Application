import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import logoInverted from "@/assets/logo-inverted.png";
import logo from "@/assets/logo.png";
import mastercard from "@/assets/tier2/mastercard.png";
import razorpay from "@/assets/tier2/razorpay.png";
import ronak from "@/assets/tier2/ronak-patel.png";
import rupay from "@/assets/tier2/rupay.png";
import crop1 from "@/assets/tier2/sample/crop-1.jpg";
import crop2 from "@/assets/tier2/sample/crop-2.jpg";
import crop3 from "@/assets/tier2/sample/crop-3.jpg";
import crop6 from "@/assets/tier2/sample/crop-6.jpg";
import page1 from "@/assets/tier2/sample/page-1.jpg";
import page2 from "@/assets/tier2/sample/page-2.jpg";
import page3 from "@/assets/tier2/sample/page-3.jpg";
import page6 from "@/assets/tier2/sample/page-6.jpg";
import upi from "@/assets/tier2/upi.png";
import visa from "@/assets/tier2/visa.png";
import { withBasePath } from "@/lib/base-path";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY } from "@/lib/company";
import { LEGAL_PAGES } from "@/lib/legal/documents";
import { GST_PERCENT, payableLabel, TIERS } from "@/lib/pricing";
import { getScoringConfig } from "@/lib/scoring/config";
import { knownVisitor, landingProse } from "@/lib/tier2/landing";
import { plain, segments } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { SampleStrip } from "./SampleStrip";
import { StickyBar } from "./StickyBar";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: TIERS.report.name };

const p = (key: string) => plain(t2(key));

/**
 * The approved prototype's words that the Landing library has not keyed yet
 * (HANDOFF §5 builds Screen 1 from the prototype). Kept here, together, so
 * they move into the library in one go once the client keys them.
 */
const PROTOTYPE = {
  coldCta: "Start with the free audit",
  free: "Free",
  auditFacts: "11 questions. About 4 minutes. Free, with no signup.",
  rangeLow: "Not ready",
  rangeHigh: "Ready to scale",
  stepQuestions: "About 30 questions",
  stepSitting: "About 15 minutes",
  stepDelivery: "Report within 24 hours",
  tagline: "Franchise. Fund. Scale.",
  prevPage: "Previous page",
  nextPage: "Next page",
  close: "Close",
  contact: "Contact",
};

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const Arrow = () => (
  <svg width="16" height="11" viewBox="0 0 18 12" fill="none" aria-hidden="true">
    <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The one primary action: to checkout for a known visitor, to the free Audit for a cold one. */
function Cta({ href, label }: { href: string; label: string }) {
  return (
    <Link className={styles.btn} href={href}>
      {label}
      <Arrow />
    </Link>
  );
}

/** The price lockup (CANONICAL-VALUES §1, from config): "₹1,999 + 18% GST", "₹2,359 payable". */
function Price({ tier = "report", big = false, center = false }: { tier?: "report" | "roadmap"; big?: boolean; center?: boolean }) {
  const pay = tier === "report" ? p("T2C-PRICE-PAY") : `${payableLabel("roadmap")} payable`;
  const className = [styles.price, big ? styles.priceBig : "", center ? styles.priceCenter : ""].join(" ");
  return (
    <div className={className}>
      <p className={styles.pl}>
        <span className={styles.amt}>{rupees(TIERS[tier].base)}</span> <span className={styles.gst}>+ {GST_PERCENT}% GST</span>
      </p>
      <p className={styles.pay}>{pay}</p>
    </div>
  );
}

/**
 * Screen 1, the Report's landing (Landing library v1.5, HANDOFF §5). Two
 * states at one URL: a visitor arriving from his Audit result (?audit=…) sees
 * his range and buys; anyone else is sent to the free Audit first (P11).
 */
export default async function ReportLanding({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const [known, config] = await Promise.all([knownVisitor(typeof query.audit === "string" ? query.audit : undefined), getScoringConfig()]);
  const prose = landingProse();
  const cold = !known;

  const buy = known ? `/report/checkout?audit=${known.token}` : "/audit";
  const ctaLabel = known ? prose.knownCta : PROTOTYPE.coldCta;
  const cta = <Cta href={buy} label={ctaLabel} />;

  // "You scored between {low} and {high}." → the words around the two numbers.
  const [headBefore = "", headBetween = "", headAfter = ""] = prose.knownHead.split(/\{low\}|\{high\}/);

  const contents = [
    { title: p("T2R-SEC-01") },
    { title: p("T2R-SEC-02") },
    { title: p("T2R-SEC-03"), chips: config.pillars.map((pillar) => pillar.displayName) },
    { title: p("T2R-SEC-04") },
    { title: p("T2R-SEC-05") },
    { title: p("T2R-SEC-07") },
    { title: p("T2R-SEC-08") },
  ];

  const boundary = prose.boundaryHead.split(/(?<=\.)\s+/);

  return (
    <div className={cold ? [styles.page, styles.cold].join(" ") : styles.page}>
      <header className={styles.top}>
        <div className={styles.wrap}>
          <Image src={logo} alt="Corporate Culture" className={styles.logo} priority />
        </div>
      </header>

      <main>
        {/* 1 · opening */}
        <section className={styles.open} id="opening">
          <div className={[styles.wrap, styles.openGrid].join(" ")}>
            <div className={styles.left}>
              <div className={styles.text}>
                <span className={[styles.mono, styles.kick].join(" ")}>{TIERS.report.name}</span>
                {known ? (
                  <>
                    <h1>
                      {headBefore}
                      <span className={styles.num}>{known.low}</span>
                      {headBetween}
                      <span className={styles.num}>{known.high}</span>
                      {headAfter}
                    </h1>
                    <p className={styles.sub}>{prose.knownSub}</p>
                  </>
                ) : (
                  <>
                    <h1>{p("T2L-COLD-HEAD")}</h1>
                    <p className={[styles.sub, styles.subWide].join(" ")}>{p("T2L-COLD-SUB")}</p>
                  </>
                )}
              </div>
              <div className={styles.cta}>
                {cta}
                {known ? <Price /> : <p className={styles.note}>{p("T2L-COLD-WHY-AUDIT")}</p>}
              </div>
            </div>
            {known ? (
              <div className={[styles.card, styles.rng].join(" ")}>
                <span className={styles.mono} style={{ color: "var(--muted)" }}>
                  {p("T2L-RANGE-LABEL")}
                </span>
                <p className={styles.big}>
                  {known.low} – {known.high}
                </p>
                <div className={styles.bar} role="img" aria-label={`${p("T2L-RANGE-LABEL")}: ${known.low} – ${known.high}`}>
                  <i style={{ left: `${known.low}%`, width: `${Math.max(1, known.high - known.low)}%` }} />
                </div>
                <div className={styles.ends} aria-hidden="true">
                  <span>{PROTOTYPE.rangeLow}</span>
                  <span>{PROTOTYPE.rangeHigh}</span>
                </div>
                <p className={styles.carry}>{p("T2L-KNOWN-CARRY")}</p>
              </div>
            ) : (
              <ol className={styles.stepcards}>
                <li className={styles.card}>
                  <span className={[styles.mono, styles.kick].join(" ")}>{p("T2L-STEP1-LABEL")}</span>
                  <p className={styles.free}>{PROTOTYPE.free}</p>
                  <p className={styles.lede} style={{ fontSize: 15 }}>
                    {PROTOTYPE.auditFacts}
                  </p>
                </li>
                <li className={[styles.card, styles.stepOn].join(" ")}>
                  <span className={[styles.mono, styles.kick].join(" ")}>{p("T2L-STEP2-LABEL")}</span>
                  <Price />
                </li>
              </ol>
            )}
          </div>
        </section>

        {/* 2 · sample pages */}
        <section className={[styles.sec, styles.samples].join(" ")} aria-labelledby="h-samples">
          <div className={styles.wrap}>
            <div className={styles.samplesHead}>
              <h2 className={styles.h2} id="h-samples">
                {p("T2L-SAMPLE-HEAD")}
              </h2>
              <p className={styles.lede}>{p("T2L-SAMPLE-SUB")}</p>
            </div>
            <SampleStrip
              hint={p("T2L-SAMPLE-HINT")}
              labels={{ prev: PROTOTYPE.prevPage, next: PROTOTYPE.nextPage, close: PROTOTYPE.close }}
              pages={[
                { thumb: crop1, full: page1, caption: p("T2L-CAP-SCORE") },
                { thumb: crop2, full: page2, caption: p("T2L-CAP-LEAD") },
                { thumb: crop3, full: page3, caption: p("T2L-CAP-AREAS") },
                { thumb: crop6, full: page6, caption: p("T2L-CAP-DIAGNOSIS") },
              ]}
            />
            {/* Secondary action, shown once: an outline button, never the orange of the purchase (Landing v1.2). */}
            <div className={styles.dl}>
              <a className={styles.btn2} href={withBasePath("/franchise-readiness-report-sample.pdf")} target="_blank" rel="noopener">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {p("T2L-SAMPLE-DL-BTN")}
              </a>
              <p className={styles.dnote}>{p("T2L-SAMPLE-DL-NOTE")}</p>
            </div>
          </div>
        </section>

        {/* 3 · contents */}
        <section className={[styles.sec, styles.contents].join(" ")} aria-labelledby="h-contents">
          <div className={[styles.wrap, styles.contentsGrid].join(" ")}>
            <h2 className={styles.h2} id="h-contents">
              {p("T2L-CONTENTS-HEAD")}
            </h2>
            <ol className={styles.idx}>
              {contents.map((item, i) => (
                <li key={item.title}>
                  <span className={styles.idxN}>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    {item.title}
                    {item.chips && (
                      <div className={styles.chips}>
                        {item.chips.map((chip) => (
                          <span key={chip}>{chip}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4 · the boundary: what the Report is, and what the Roadmap adds */}
        <section className={[styles.sec, styles.not].join(" ")} aria-labelledby="h-not">
          <div className={[styles.wrap, styles.notGrid].join(" ")}>
            <div>
              <h2 className={styles.notBig} id="h-not">
                {boundary.map((sentence, i) =>
                  i === boundary.length - 1 && sentence.includes("the Roadmap") ? (
                    <span key={i}>
                      {sentence.replace(/the Roadmap\.$/, "")}
                      <em>the Roadmap</em>.
                    </span>
                  ) : (
                    <span key={i}>
                      {sentence}
                      <br />
                    </span>
                  ),
                )}
              </h2>
              <p className={styles.notLede}>{p("T2L-BOUNDARY")}</p>
            </div>
            <div>
              <div className={styles.vs}>
                <div className={styles.item}>
                  <p className={[styles.tag, styles.tRep].join(" ")}>
                    <i aria-hidden="true" />
                    {p("T2L-TAG-REPORT")}
                  </p>
                  <div className={[styles.col, styles.rep].join(" ")}>
                    <h3>{p("T2L-REPORT-DOES")}</h3>
                    <p className={styles.d}>{p("T2L-REPORT-GETS")}</p>
                    <Price />
                  </div>
                </div>
                <div className={styles.item}>
                  <p className={[styles.tag, styles.tRoad].join(" ")}>
                    <i aria-hidden="true" />
                    {p("T2L-TAG-ROADMAP")}
                  </p>
                  <div className={[styles.col, styles.road].join(" ")}>
                    <h3>{p("T2L-ROADMAP-DOES")}</h3>
                    <p className={styles.d}>{p("T2L-ROADMAP-ADDS")}</p>
                    <Price tier="roadmap" />
                  </div>
                </div>
              </div>
              <p className={styles.when}>{p("T2L-ROADMAP-WHEN")}</p>
            </div>
          </div>
        </section>

        {/* 5 · the reviewer */}
        <section className={styles.sec} aria-labelledby="h-rev">
          <div className={[styles.wrap, styles.revGrid].join(" ")}>
            <Image className={styles.pic} src={ronak} alt={p("T2R-BIO-NAME")} sizes="(min-width: 900px) 300px, 112px" />
            <div className={styles.who}>
              <span className={[styles.mono, styles.kick].join(" ")}>{p("T2L-REVIEWER-KICKER")}</span>
              <h2 id="h-rev">{p("T2R-BIO-NAME")}</h2>
              <p className={styles.role}>{p("T2R-BIO-ROLE")}</p>
            </div>
            <div className={styles.more}>
              <p className={styles.line}>{p("T2L-REVIEWER-LINE")}</p>
              <ul className={styles.creds}>
                {["T2L-CRED-1", "T2L-CRED-2"].map((key) => (
                  <li key={key}>
                    <span aria-hidden="true">—</span>
                    <span>{p(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 6 · price, with the payment trust block */}
        <section className={[styles.sec, styles.pricesec].join(" ")} id="price" aria-labelledby="h-price">
          <div className={styles.wrap}>
            <div className={[styles.card, styles.pcard].join(" ")}>
              <h2 id="h-price">{p("T2L-PRICE-HEAD")}</h2>
              <Price big center />
              <p className={styles.covers}>{p("T2L-PRICE-COVERS")}</p>
              <div className={styles.pcardAct}>
                {cta}
                {cold && <p className={styles.coldnote}>{p("T2L-PRICE-COLD")}</p>}
              </div>
              <div className={styles.trust}>
                <Image className={styles.rzp} src={razorpay} alt="" />
                <p className={styles.tl}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="2.5" y="7" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  {p("T2L-PAY-SECURE")}
                </p>
                <ul className={styles.methods} aria-label={p("T2L-PAY-METHODS")}>
                  <li>
                    <Image src={upi} alt="UPI" style={{ height: 18 }} />
                  </li>
                  <li>
                    <Image src={rupay} alt="RuPay" style={{ height: 16 }} />
                  </li>
                  <li>
                    <Image src={visa} alt="Visa" style={{ height: 15 }} />
                  </li>
                  <li>
                    <Image src={mastercard} alt="Mastercard" style={{ height: 22 }} />
                  </li>
                </ul>
                <p className={styles.ts}>{p("T2L-PAY-METHODS")}</p>
                <p className={styles.tl}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3.5 1.5h6l3 3v10h-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M6 8h4M6 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {p("T2L-PAY-INVOICE")}
                </p>
                <Link href="/refunds" target="_blank">
                  {p("T2L-PAY-REFUND")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 7 · what happens, and when */}
        <section className={styles.sec} aria-labelledby="h-steps">
          <div className={[styles.wrap, styles.stepsWrap].join(" ")}>
            <h2 className={styles.h2} id="h-steps">
              {p("T2L-STEPS-HEAD")}
            </h2>
            <ol className={styles.steps}>
              {[
                [PROTOTYPE.stepQuestions, "T2L-STEP-QUESTIONS"],
                [PROTOTYPE.stepSitting, "T2L-STEP-SITTING"],
                [PROTOTYPE.stepDelivery, "T2L-STEP-DELIVERY"],
              ].map(([title, key], i) => (
                <li key={key}>
                  <span className={styles.stepN}>{i + 1}</span>
                  <div>
                    <b>{title}</b>
                    <p>{p(key)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 8 · FAQ */}
        <section className={[styles.sec, styles.faq].join(" ")} aria-labelledby="h-faq">
          <div className={[styles.wrap, styles.faqWrap].join(" ")}>
            <h2 className={styles.h2} id="h-faq">
              {p("T2L-FAQ-HEAD")}
            </h2>
            <div className={styles.list}>
              {prose.faq.map((item, i) => (
                <details key={item.key} open={i === 0}>
                  <summary>
                    {item.question}
                    <span className={styles.pm} aria-hidden="true" />
                  </summary>
                  <div className={styles.a}>
                    {segments(item.answer).map((s, j) => (s.strong ? <strong key={j}>{s.text}</strong> : s.text))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 9 · closing */}
        <section className={styles.close} aria-labelledby="h-close">
          <div className={[styles.wrap, styles.closeWrap].join(" ")}>
            <h2 id="h-close">{p(known ? "T2L-CLOSE-KNOWN" : "T2L-CLOSE-COLD")}</h2>
            <div className={styles.act}>
              {cta}
              {known ? <Price /> : <p className={styles.freeNote}>{PROTOTYPE.auditFacts}</p>}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.foot}>
        <div className={styles.wrap}>
          <div className={styles.row}>
            <div className={styles.brandCol}>
              <Image src={logoInverted} alt="Corporate Culture" className={styles.footLogo} />
              <p className={[styles.m, styles.tagline].join(" ")}>{PROTOTYPE.tagline}</p>
            </div>
            <address>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <span>WhatsApp {WHATSAPP_DISPLAY}</span>
            </address>
          </div>
          <div className={styles.base}>
            <nav aria-label="Legal">
              {LEGAL_PAGES.map((page) => (
                <Link key={page.slug} className={styles.m} href={`/${page.slug}`}>
                  {page.label}
                </Link>
              ))}
              <a className={styles.m} href={`mailto:${CONTACT_EMAIL}`}>
                {PROTOTYPE.contact}
              </a>
            </nav>
            <p className={styles.m}>{p("T2C-ENTITY")}</p>
          </div>
        </div>
      </footer>

      <StickyBar label={ctaLabel}>
        {known && <Price />}
        {cta}
      </StickyBar>
    </div>
  );
}
