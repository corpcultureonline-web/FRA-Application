import Image from "next/image";
import type { ReactNode } from "react";
import founderPhoto from "@/assets/ronak-patel.jpg";
import { AuditHeader } from "@/components/AuditHeader";
import { RatingPill } from "@/components/RatingPill";
import { Rich } from "@/components/Rich";
import { BRAND_ENTITY_LINE, CONTACT_EMAIL, FOUNDER_STATS, WHATSAPP_DISPLAY } from "@/lib/company";
import { shortPriceLabel } from "@/lib/pricing";
import type { NoteKind, ReportData } from "@/lib/result";
import { GetReportButton } from "./GetReportButton";
import { UpgradeBody } from "./ReportDocument";
import { SentToBanner } from "./SentToBanner";

const monoCaps = "font-mono text-[11px] uppercase tracking-[0.25em]";
const REPORT_ANCHOR = "full-report";
const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"];

/**
 * The Tier 1 result on the website: score card pinned on the left, the report
 * on the right. Same ReportData — and so the same Content Library words — as
 * the PDF (ReportDocument); only the layout differs. Order follows R1.
 */
export function ResultPage({ report, tier2Url }: { report: ReportData; tier2Url?: string }) {
  const { content } = report;
  const weakCount = report.areas.filter((a) => a.status === "Weak").length;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-cream text-ink">
      <AuditHeader />
      <main className="mx-auto w-full max-w-[1200px] px-5 pt-8 pb-16 sm:px-8 lg:pt-14 xl:px-0">
        <p className={`${monoCaps} text-[10px] text-muted`}>Franchise Readiness Audit — Preliminary result</p>
        <h1 className="mt-2 text-[2.1rem] leading-[1.1] font-extrabold tracking-tight lg:text-[3.2rem]">
          {report.brandName}
        </h1>
        <p className="mt-2 text-body lg:text-lg">{report.meta}</p>
        <SentToBanner token={report.token} />

        <div className="mt-8 grid gap-12 lg:mt-10 lg:grid-cols-[420px_1fr] lg:gap-20">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <ScoreCard report={report} />
          </aside>

          <div className="min-w-0">
            {content.toldUs.length ? (
              <Section title="What you told us">
                <Bullets items={content.toldUs} />
              </Section>
            ) : null}

            {content.noticed.length ? (
              <Section title="What we noticed">
                <Numbered items={content.noticed} />
              </Section>
            ) : null}

            <Section title="Your score in each area">
              <AreaTable report={report} />
            </Section>

            {content.legal.length ? (
              <Section title="Legal check">
                <Notes notes={content.legal} />
              </Section>
            ) : null}

            {content.importantPoints.length ? (
              <Section title="Important points to note">
                <Notes notes={content.importantPoints} />
              </Section>
            ) : null}

            {content.nutshell.length ? (
              <Section title="In a nutshell">
                <div className="rounded-xl bg-sand px-5 py-5 sm:px-7">
                  <Bullets items={content.nutshell} />
                </div>
              </Section>
            ) : null}

            {content.cannotTell ? (
              <Section title="What this test cannot tell you">
                {content.cannotTell.intro ? (
                  <p className="mb-5 text-[17px] leading-relaxed text-body">{content.cannotTell.intro}</p>
                ) : null}
                <Numbered items={content.cannotTell.items} />
                {content.cannotTell.close ? (
                  <p className="mt-5 text-[17px] leading-relaxed text-body">
                    <Rich text={content.cannotTell.close} />
                  </p>
                ) : null}
              </Section>
            ) : null}

            <Section title="Where you sit on the readiness ladder">
              <Ladder report={report} />
            </Section>

            {content.canDoNow ? (
              <Section title="What you can do now">
                <div className="space-y-3 rounded-xl border-l-[3px] border-l-[#e0a100] bg-[#fdf3e7] px-5 py-5 text-[17px] leading-relaxed text-body sm:px-7">
                  {content.canDoNow.lead ? <p>{content.canDoNow.lead}</p> : null}
                  {content.canDoNow.actions.length ? (
                    <ol className="space-y-3">
                      {content.canDoNow.actions.map((action, i) => (
                        <li key={action.heading}>
                          <strong className="text-ink">
                            {i + 1}. {action.heading}
                          </strong>{" "}
                          <Rich text={action.body} />
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {content.canDoNow.fallback ? <p>{content.canDoNow.fallback}</p> : null}
                </div>
              </Section>
            ) : null}

            {content.upgrade ? <FullReport report={report} weakCount={weakCount} tier2Url={tier2Url} /> : null}

            <p className="mt-12 border-t border-black/10 pt-5 text-[13px] leading-relaxed text-muted">
              This result is based on the answers you provided. It is a decision-support tool, not a guarantee of
              franchise success.
              <br />
              Corporate Culture · corpculture.co · {CONTACT_EMAIL} · {WHATSAPP_DISPLAY}
              <br />
              {BRAND_ENTITY_LINE}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-14 scroll-mt-8 first:mt-0">
      <h2 className="border-b border-black/10 pb-3 text-[26px] leading-tight font-bold lg:text-[28px]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RangeBar({ range, dark = false }: { range: ReportData["range"]; dark?: boolean }) {
  return (
    <div className={`relative h-2.5 rounded-full ${dark ? "bg-white/25" : "bg-sand"}`} aria-hidden="true">
      <div
        className={`absolute inset-y-0 rounded-full ${dark ? "bg-cta" : "bg-brand"}`}
        style={{ left: `${range.low}%`, width: `${range.high - range.low}%` }}
      />
    </div>
  );
}

function ScoreCard({ report }: { report: ReportData }) {
  const { range, content } = report;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="pt-2.5 text-[13px] font-bold tracking-[0.18em] whitespace-nowrap text-muted uppercase">
          Your score
        </p>
        <p className="rounded-md bg-cta px-3 py-2 text-right text-[12px] leading-tight font-bold tracking-[0.06em] text-ink uppercase">
          {report.badge}
        </p>
      </div>
      {content.gateReason ? (
        <p className="mt-3 text-right text-[13px] font-semibold text-brand-deep">
          <Rich text={content.gateReason} strongClass="text-brand-deep" />
        </p>
      ) : null}
      <p className="mt-4 text-[64px] leading-none font-black tracking-tight text-brand sm:text-[80px]">
        {range.low} – {range.high}
      </p>
      <div className="mt-8">
        <RangeBar range={range} />
      </div>
      <div className="mt-2.5 flex justify-between text-sm text-muted">
        <span>Not ready</span>
        <span>Ready to scale</span>
      </div>
      {content.scoreNote.length ? (
        <div className="mt-5 space-y-3 border-t border-black/10 pt-5 leading-relaxed text-body">
          {content.scoreNote.map((line) => (
            <p key={line}>
              <Rich text={line} />
            </p>
          ))}
        </div>
      ) : null}
      {content.upgrade ? (
        <a
          href={`#${REPORT_ANCHOR}`}
          className="mt-6 inline-block font-bold text-brand-deep underline underline-offset-4 hover:text-brand"
        >
          Get your exact score with the full report ↓
        </a>
      ) : null}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((line) => (
        <li key={line} className="flex gap-3 text-[17px] leading-relaxed text-body">
          <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-muted/60" />
          <span>
            <Rich text={line} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Numbered({ items }: { items: { heading: string; body: string }[] }) {
  return (
    <ol className="space-y-5">
      {items.map((item, i) => (
        <li key={item.heading}>
          <p className="text-[17px] font-bold">
            {i + 1}. {item.heading}
          </p>
          <p className="mt-1 text-[17px] leading-relaxed text-body">
            <Rich text={item.body} />
          </p>
        </li>
      ))}
    </ol>
  );
}

const NOTE_STYLES: Record<NoteKind, { label: string; border: string; text: string }> = {
  strength: { label: "Strength", border: "border-l-[#2e8b57]", text: "text-[#1b6b2f]" },
  milestone: { label: "Next milestone", border: "border-l-[#e0a100]", text: "text-[#8a5300]" },
  watch: { label: "Watch", border: "border-l-cta", text: "text-brand-deep" },
};

function Notes({ notes }: { notes: { kind: NoteKind; text: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {notes.map((note) => {
        const style = NOTE_STYLES[note.kind];
        return (
          <li
            key={note.text}
            className={`rounded-lg border border-l-[3px] border-black/10 bg-white px-5 py-4 ${style.border}`}
          >
            <p className={`${monoCaps} text-[10px] ${style.text}`}>{style.label}</p>
            <p className="mt-1.5 leading-relaxed text-body">
              <Rich text={note.text} />
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function AreaTable({ report }: { report: ReportData }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className={`flex justify-between bg-[#f9f6f2] px-4 py-3 sm:px-5 ${monoCaps} text-[10px] text-muted`}>
        <span>Area · what it asks</span>
        <span>Status</span>
      </div>
      <ul>
        {report.areas.map((area) => (
          <li
            key={area.code}
            className="flex items-center gap-4 border-t border-black/10 px-4 py-3.5 sm:grid sm:grid-cols-[190px_1fr_auto] sm:px-5"
          >
            <div className="min-w-0 flex-1 sm:contents">
              <p className="font-bold">{area.name}</p>
              <p className="text-[15px] text-muted">{area.question}</p>
            </div>
            {area.status ? (
              <RatingPill rating={area.status} />
            ) : (
              <span className="text-sm text-muted">Not answered</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ladder({ report }: { report: ReportData }) {
  const { intro, close } = report.content.ladder;
  return (
    <>
      {intro ? (
        <p className="leading-relaxed text-body">
          <Rich text={intro} />
        </p>
      ) : null}
      <ol className="mt-5 overflow-hidden rounded-xl border border-black/10 bg-white">
        {report.ladder.map((band) => (
          <li
            key={band.code}
            className={`grid gap-1 border-t border-black/10 px-4 py-4 first:border-t-0 sm:grid-cols-[190px_1fr] sm:gap-6 sm:px-5 ${
              band.yours ? "border-l-[3px] border-l-cta bg-peach" : ""
            }`}
          >
            <div>
              {band.yours ? <p className={`${monoCaps} text-[10px] text-brand-deep`}>Your range</p> : null}
              <p className={`font-bold ${band.yours ? "text-ink" : "text-muted"}`}>{band.name}</p>
            </div>
            <p className={`text-[15px] leading-relaxed ${band.yours ? "text-body" : "text-muted"}`}>{band.body}</p>
          </li>
        ))}
      </ol>
      {close ? <p className="mt-4 text-sm leading-relaxed text-body">{close}</p> : null}
    </>
  );
}

/** "which of your four weak areas to fix first" — or a neutral phrase when none. */
function areasToFixPhrase(count: number) {
  if (count === 0) return "which areas to strengthen first";
  if (count === 1) return "how to fix your one weak area";
  return `which of your ${NUMBER_WORDS[count] ?? count} weak areas to fix first`;
}

const PRICE = shortPriceLabel("report");

const STEPS = [
  { title: `Pay ${PRICE}`, body: "One payment. No subscription." },
  {
    title: "Answer about thirty more questions",
    body: "About 15 minutes. Your 11 answers carry over, so no question is asked twice.",
  },
  { title: "Get your report within 24 hours", body: "Reviewed personally by Ronak before it reaches you." },
];

function FullReport({ report, weakCount, tier2Url }: { report: ReportData; weakCount: number; tier2Url?: string }) {
  const upgrade = report.content.upgrade!;
  const range = `${report.range.low} – ${report.range.high}`;
  const comparison: [string, string, string][] = [
    ["Questions", "11", "Your 11 answers, plus about thirty more"],
    ["Your score", `A range (${range})`, "One exact number"],
    ["The 7 areas", "Good, Average or Weak", "Each one explained in writing"],
    ["Your problems", "Named", "Ranked by what they cost you"],
    ["Legal check", "Trademark and disputes", "Full legal and approvals check"],
    ["Similar brands", "—", "How you compare with brands we have worked with"],
    ["Reviewed by Ronak", "—", "Every report, personally"],
    ["When you get it", "On screen now", "Within 24 hours"],
  ];
  const buttonClass =
    "mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-md bg-cta px-8 text-sm font-bold tracking-[0.18em] uppercase transition-colors hover:bg-cta-hover disabled:opacity-70 sm:w-auto";
  const buttonLabel = (
    <>
      I’m interested{" "}
      <span aria-hidden="true" className="text-lg leading-none">
        →
      </span>
    </>
  );

  return (
    <Section title={upgrade.heading ?? "If you want to know exactly where you stand"} id={REPORT_ANCHOR}>
      <div className="rounded-xl bg-ink p-6 text-white sm:p-8">
        <p className={`${monoCaps} text-[10px] text-white/60`}>Your result today</p>
        <p className="mt-3 text-[52px] leading-none font-black text-cta sm:text-[60px]">{range}</p>
        <div className="mt-5">
          <RangeBar range={report.range} dark />
        </div>
        <p className="mt-5 leading-relaxed text-white/85">
          This audit tells you roughly where you stand.{" "}
          <strong className="text-white">The Franchise Readiness Report tells you exactly</strong> — one score
          instead of a range, every area explained, and {areasToFixPhrase(weakCount)}.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 bg-white">
        <table className="w-full min-w-[480px] table-fixed text-left text-[15px]">
          <thead>
            <tr className="text-[13px] tracking-[0.1em] uppercase">
              <th className="w-[30%] bg-[#f9f6f2] px-3 py-3.5 sm:px-5">
                <span className="sr-only">Feature</span>
              </th>
              <th className="bg-[#f9f6f2] px-3 py-3.5 font-bold text-muted sm:px-5">This free audit</th>
              <th className="bg-[#fbe6cf] px-3 py-3.5 font-bold text-brand-deep sm:px-5">The report · {PRICE}</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map(([label, free, paid]) => (
              <tr key={label} className="border-t border-black/10 align-top">
                <th scope="row" className="px-3 py-3.5 font-bold sm:px-5">
                  {label}
                </th>
                <td className="px-3 py-3.5 text-body sm:px-5">{free}</td>
                <td className="bg-peach px-3 py-3.5 font-bold sm:px-5">{paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="mt-5 grid gap-5 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cta font-bold">
              {i + 1}
            </span>
            <div>
              <p className="text-[17px] leading-tight font-bold">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* The offer and Ronak's bio form one block, never split (R8). */}
      <div className="mt-5 overflow-hidden rounded-xl border border-ink bg-white">
        <div className="p-5 sm:p-9">
          <p className={`${monoCaps} text-[10px] text-brand-deep`}>Tier 2 · Opening soon</p>
          {upgrade.title ? <h3 className="mt-3 text-2xl font-bold">{upgrade.title}</h3> : null}
          <UpgradeBody body={upgrade.body} className="mt-3" priceClass="text-[34px] font-black text-brand" />

          {tier2Url ? (
            <a href={tier2Url} className={buttonClass}>
              {buttonLabel}
            </a>
          ) : (
            <GetReportButton
              token={report.token}
              interested={report.interested}
              phoneGiven={report.phoneGiven}
              className={buttonClass}
              label={buttonLabel}
            />
          )}

          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Have a question first? Write to us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-ink hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            or WhatsApp <strong className="text-ink">{WHATSAPP_DISPLAY}</strong>
          </p>
        </div>

        <div className="border-t border-black/10 bg-cream p-5 sm:p-9">
          <div className="flex items-center gap-4">
            <Image
              src={founderPhoto}
              alt="Ronak Patel"
              className="size-[72px] shrink-0 rounded-full object-cover object-top sm:size-[88px]"
              sizes="88px"
            />
            <div>
              <p className="text-[13px] font-bold tracking-[0.15em] text-brand-deep uppercase">
                Who conducts your audit
              </p>
              <p className="text-[26px] leading-tight font-bold">Ronak Patel</p>
            </div>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-body">
            Corporate Culture has worked with consumer brands across F&amp;B, retail, lifestyle, wellness and
            education — helping them scale with structure, funding access and long-term expansion clarity. The
            7-area framework behind this assessment comes from those engagements. The framework is Ronak’s, and he
            personally reviews every paid report.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            {FOUNDER_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse justify-end">
                <dt className="mt-1 text-[11px] font-bold tracking-[0.15em] text-muted uppercase">{stat.label}</dt>
                <dd className="text-[28px] font-extrabold whitespace-nowrap text-brand">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
