import Image from "next/image";
import type { ReactNode } from "react";
import founderPhoto from "@/assets/ronak-patel.jpg";
import { RatingPill } from "@/components/RatingPill";
import { Rich } from "@/components/Rich";
import { CONTACT_EMAIL, FOUNDER_STATS, WHATSAPP_DISPLAY } from "@/lib/company";
import type { AuditResult, NoteKind } from "@/lib/result";

const monoCaps = "font-mono text-[11px] uppercase tracking-[0.25em]";
const REPORT_ANCHOR = "full-report";
const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"];

export type InterestState = "idle" | "saving" | "done" | { error: string };

function rangeText({ low, high }: AuditResult["range"]) {
  return `${low} – ${high}`;
}

/** "which of your four weak areas to fix first" — or a neutral phrase when none. */
function areasToFixPhrase(count: number) {
  if (count === 0) return "which areas to strengthen first";
  if (count === 1) return "how to fix your one weak area";
  return `which of your ${NUMBER_WORDS[count] ?? count} weak areas to fix first`;
}

function RangeBar({ range, dark = false }: { range: AuditResult["range"]; dark?: boolean }) {
  return (
    <div className={`relative h-2.5 rounded-full ${dark ? "bg-white/25" : "bg-sand"}`} aria-hidden="true">
      <div
        className={`absolute inset-y-0 rounded-full ${dark ? "bg-cta" : "bg-brand"}`}
        style={{ left: `${range.low}%`, width: `${range.high - range.low}%` }}
      />
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-14 scroll-mt-8 first:mt-0">
      <h2 className="border-b border-black/10 pb-3 text-[26px] leading-tight font-bold lg:text-[28px]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const NOTE_STYLES: Record<NoteKind, { label: string; border: string; text: string }> = {
  strength: { label: "Strength", border: "border-l-[#2e8b57]", text: "text-[#1b6b2f]" },
  milestone: { label: "Next milestone", border: "border-l-[#e0a100]", text: "text-[#8a5300]" },
  watch: { label: "Watch", border: "border-l-cta", text: "text-brand-deep" },
};

function NoteCard({ kind, text }: { kind: NoteKind; text: string }) {
  const style = NOTE_STYLES[kind];
  return (
    <li className={`rounded-lg border border-l-[3px] border-black/10 bg-white px-5 py-4 ${style.border}`}>
      <p className={`${monoCaps} text-[10px] ${style.text}`}>{style.label}</p>
      <p className="mt-1.5 leading-relaxed text-body">
        <Rich text={text} />
      </p>
    </li>
  );
}

function ScoreCard({ result }: { result: AuditResult }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="pt-2.5 text-[13px] font-bold tracking-[0.18em] whitespace-nowrap text-muted uppercase">
          Your score
        </p>
        <p className="rounded-md bg-cta px-3 py-2 text-right text-[12px] leading-tight font-bold tracking-[0.06em] text-ink uppercase">
          {result.levels.map((level) => level.name).join(" – ")}
        </p>
      </div>
      {result.gateReason ? (
        <p className="mt-3 text-right text-[13px] font-semibold text-brand-deep">{result.gateReason}</p>
      ) : null}
      <p className="mt-4 text-[64px] leading-none font-black tracking-tight text-brand sm:text-[80px]">
        {rangeText(result.range)}
      </p>
      <div className="mt-8">
        <RangeBar range={result.range} />
      </div>
      <div className="mt-2.5 flex justify-between text-sm text-muted">
        <span>Not ready</span>
        <span>Ready to scale</span>
      </div>
      <div className="mt-5 space-y-3 border-t border-black/10 pt-5 leading-relaxed text-body">
        <p>
          This is a range, not one number. 11 questions can tell us roughly where you stand, but not
          exactly.
        </p>
        <p>{result.verdict}</p>
      </div>
      <a
        href={`#${REPORT_ANCHOR}`}
        className="mt-6 inline-block font-bold text-brand-deep underline underline-offset-4 hover:text-brand"
      >
        Get your exact score with the full report ↓
      </a>
    </div>
  );
}

function AreaTable({ result }: { result: AuditResult }) {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        <div className={`flex justify-between bg-[#f9f6f2] px-4 py-3 sm:px-5 ${monoCaps} text-[10px] text-muted`}>
          <span>Area · what it asks</span>
          <span>Status</span>
        </div>
        <ul>
          {result.areas.map((area) => (
            <li
              key={area.code}
              className={`flex items-center gap-4 border-t border-black/10 px-4 py-3.5 sm:grid sm:grid-cols-[190px_1fr_auto] sm:px-5 ${
                area.weakest ? "bg-peach" : ""
              }`}
            >
              <div className="min-w-0 flex-1 sm:contents">
                <p className="font-bold">
                  {area.name}
                  {area.weakest ? (
                    <span className={`${monoCaps} ml-2 text-[9px] text-brand-deep`}>Weakest</span>
                  ) : null}
                </p>
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
      {result.weakest ? (
        <div className="mt-4 rounded-xl bg-peach px-5 py-5 sm:px-6">
          <p className={`${monoCaps} text-[10px] text-brand-deep`}>Weakest area</p>
          <p className="mt-1 text-xl font-bold">{result.weakest.name}</p>
          <p className="mt-2 leading-relaxed text-body">{result.weakest.line}</p>
        </div>
      ) : null}
    </>
  );
}

function Ladder({ result }: { result: AuditResult }) {
  const yours = result.ladder.filter((band) => band.yours);
  const span =
    yours.length === 1 ? "sits in this level" : `covers these ${NUMBER_WORDS[yours.length] ?? yours.length} levels`;
  return (
    <>
      <p className="leading-relaxed text-body">
        <strong className="text-ink">This is not a ranking against other brands.</strong> It is the
        standard every business is measured against, and it shows what a brand at each level
        typically looks like.
      </p>
      <ol className="mt-5 overflow-hidden rounded-xl border border-black/10 bg-white">
        {result.ladder.map((band) => (
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
            <p className={`text-[15px] leading-relaxed ${band.yours ? "text-body" : "text-muted"}`}>
              {band.body}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm leading-relaxed text-body">
        Your score range of {result.range.low} to {result.range.high} {span}
        {result.gateReason ? `. ${result.gateReason}` : "."}
      </p>
    </>
  );
}

const STEPS = [
  { title: "Pay ₹2,999", body: "One payment. No subscription." },
  {
    title: "Answer 33 more questions",
    body: "About 15 minutes. Your 11 answers carry over, so no question is asked twice.",
  },
  { title: "Get your report within 24 hours", body: "Reviewed personally by Ronak before it reaches you." },
];

function FullReport({
  result,
  interest,
  onInterested,
}: {
  result: AuditResult;
  interest: InterestState;
  /** Absent in the PDF, where there is nothing to press. */
  onInterested?: () => void;
}) {
  const toFix = areasToFixPhrase(result.areasToFix);
  const comparison: [string, string, string][] = [
    ["Questions", "11", "44 — your 11 carry over"],
    ["Your score", `A range (${rangeText(result.range)})`, "One exact number"],
    ["The 7 areas", "Good, Average or Weak", "Each one explained in writing"],
    ["Your problems", "Named", "Ranked by what they cost you"],
    ["Legal check", "Trademark and disputes", "Full legal and approvals check"],
    ["Similar brands", "—", "How you compare with brands we have worked with"],
    ["Reviewed by Ronak", "—", "Every report, personally"],
    ["When you get it", "On screen now", "Within 24 hours"],
  ];

  return (
    <Section title="If you want to know exactly where you stand" id={REPORT_ANCHOR}>
      <div className="rounded-xl bg-ink p-6 text-white sm:p-8">
        <p className={`${monoCaps} text-[10px] text-white/60`}>Your result today</p>
        <p className="mt-3 text-[52px] leading-none font-black text-cta sm:text-[60px]">
          {rangeText(result.range)}
        </p>
        <div className="mt-5">
          <RangeBar range={result.range} dark />
        </div>
        <p className="mt-5 leading-relaxed text-white/85">
          This audit tells you roughly where you stand.{" "}
          <strong className="text-white">The Franchise Readiness Report tells you exactly</strong> —
          one score instead of a range, every area explained, and {toFix}.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full table-fixed text-left text-[15px]">
          <thead>
            <tr className="text-[13px] tracking-[0.1em] uppercase">
              <th className="w-[30%] bg-[#f9f6f2] px-3 py-3.5 sm:px-5">
                <span className="sr-only">Feature</span>
              </th>
              <th className="bg-[#f9f6f2] px-3 py-3.5 font-bold text-muted sm:px-5">This free audit</th>
              <th className="bg-[#fbe6cf] px-3 py-3.5 font-bold text-brand-deep sm:px-5">The report · ₹2,999</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map(([label, free, report]) => (
              <tr key={label} className="border-t border-black/10 align-top">
                <th scope="row" className="px-3 py-3.5 font-bold sm:px-5">
                  {label}
                </th>
                <td className="px-3 py-3.5 text-body sm:px-5">{free}</td>
                <td className="bg-peach px-3 py-3.5 font-bold sm:px-5">{report}</td>
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

      {/* Tier 2 offer and Ronak's bio form one block, never split (decision R8). */}
      <div className="mt-5 overflow-hidden rounded-xl border border-ink bg-white">
        <div className="p-5 sm:p-9">
          <p className={`${monoCaps} text-[10px] text-brand-deep`}>Tier 2 · Opening soon</p>
          <h3 className="mt-3 text-2xl font-bold">The Franchise Readiness Report</h3>
          <p className="mt-1 font-bold text-brand-deep">44 questions instead of 11</p>
          <p className="mt-3 text-[15px] text-muted">
            About 15 minutes. Your earlier answers carry over — no question is asked twice.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-body">
            <li>
              <strong className="text-ink">Your exact score</strong> — one number, not a range
            </li>
            <li>
              <strong className="text-ink">All 7 areas explained in writing</strong> — what is working,
              what is not, and why it matters for franchising
            </li>
            <li>
              <strong className="text-ink">Your problems ranked</strong> — so you know {toFix}
            </li>
            <li>
              <strong className="text-ink">Your full legal and approvals check</strong>
            </li>
            <li>
              <strong className="text-ink">Where you stand</strong> compared with similar brands we
              have worked with
            </li>
          </ul>
          <div className="mt-5 border-t border-black/10 pt-4">
            <p className="text-[34px] font-black text-brand">₹2,999</p>
            <p className="text-[15px] text-muted">One payment. You will receive your report within 24 hours.</p>
            {!onInterested ? null : interest === "done" ? (
              <p className="mt-5 rounded-md bg-[#e3f1e5] px-4 py-3 font-bold text-[#1b4d2b]" role="status">
                ✓ You’re on the list. We’ll invite you at {result.email} as soon as the Report opens.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onInterested}
                  disabled={interest === "saving"}
                  className="mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-md bg-cta px-8 text-sm font-bold tracking-[0.18em] uppercase transition-colors hover:bg-cta-hover disabled:opacity-70 sm:w-auto"
                >
                  {interest === "saving" ? "Saving…" : "I’m interested"}
                  <span aria-hidden="true" className="text-lg leading-none">
                    →
                  </span>
                </button>
                {typeof interest === "object" ? (
                  <p className="mt-3 text-sm text-brand-deep" role="alert">
                    {interest.error}
                  </p>
                ) : null}
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  No payment now. We’ll invite you at{" "}
                  <strong className="text-ink [overflow-wrap:anywhere]">{result.email}</strong> as soon as
                  the Report opens.
                </p>
              </>
            )}
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Have a question first? Write to us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-ink hover:underline">
                {CONTACT_EMAIL}
              </a>{" "}
              or WhatsApp <strong className="text-ink">{WHATSAPP_DISPLAY}</strong>
            </p>
          </div>
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
            Corporate Culture has worked with consumer brands across F&amp;B, retail, lifestyle,
            wellness and education — helping them scale with structure, funding access and long-term
            expansion clarity. The 7-area framework behind this assessment comes from those
            engagements. The framework is Ronak’s, and he personally reviews every paid report.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            {FOUNDER_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse justify-end">
                <dt className="mt-1 text-[11px] font-bold tracking-[0.15em] text-muted uppercase">
                  {stat.label}
                </dt>
                <dd className="text-[28px] font-extrabold whitespace-nowrap text-brand">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}

/**
 * Report order follows decision R1. "What we noticed", "Important points",
 * "In a nutshell" and "What this test cannot tell you" are left out until the
 * Content Library has entries for them (spec §11).
 */
export function ResultReport({
  result,
  interest = "idle",
  onInterested,
}: {
  result: AuditResult;
  interest?: InterestState;
  /** Omitted for the PDF (/audit/report/[token]): no button, no email banner. */
  onInterested?: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 pt-8 pb-16 sm:px-8 lg:pt-14 xl:px-0">
      <p className={`${monoCaps} text-[10px] text-muted`}>Franchise Readiness Audit — Preliminary result</p>
      <h1 className="mt-2 text-[2.1rem] leading-[1.1] font-extrabold tracking-tight lg:text-[3.2rem]">
        {result.brandName}
      </h1>
      <p className="mt-2 text-body lg:text-lg">{result.meta}</p>
      {onInterested ? (
        <p className="mt-5 inline-flex items-start gap-2.5 rounded-md bg-[#e3f1e5] px-4 py-3 text-[15px] text-[#1b4d2b]">
          <span aria-hidden="true" className="font-bold">
            ✓
          </span>
          <span>
            A summary of this result has been sent to{" "}
            <strong className="[overflow-wrap:anywhere]">{result.email}</strong>.
          </span>
        </p>
      ) : null}

      <div className="mt-8 grid gap-12 lg:mt-10 lg:grid-cols-[420px_1fr] lg:gap-20">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <ScoreCard result={result} />
        </aside>

        <div className="min-w-0">
          <Section title="What you told us">
            <ul className="space-y-2.5">
              {result.toldUs.map((line) => (
                <li key={line} className="flex gap-3 text-[17px] leading-relaxed text-body">
                  <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-muted/60" />
                  <span>
                    <Rich text={line} />
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Your score in each area">
            <AreaTable result={result} />
          </Section>

          <Section title="Legal check">
            <ul className="space-y-2.5">
              {result.legal.map((note) => (
                <NoteCard key={note.text} {...note} />
              ))}
            </ul>
          </Section>

          <Section title="Where you sit on the readiness ladder">
            <Ladder result={result} />
          </Section>

          <Section title="What you can do now">
            <div className="space-y-3 rounded-xl border-l-[3px] border-l-[#e0a100] bg-[#fdf3e7] px-5 py-5 text-[17px] leading-relaxed text-body sm:px-7">
              {result.doNow.fallback ? <p>{result.doNow.fallback}</p> : null}
              {result.doNow.actions.length ? (
                <ol className="space-y-3">
                  {result.doNow.actions.map((action, i) => (
                    <li key={action.title}>
                      <strong className="text-ink">
                        {i + 1}. {action.title}
                      </strong>{" "}
                      {action.body}
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </Section>

          <FullReport result={result} interest={interest} onInterested={onInterested} />

          <p className="mt-12 border-t border-black/10 pt-5 text-[13px] leading-relaxed text-muted">
            This result is based on the answers you provided. It is a decision-support tool, not a
            guarantee of franchise success.
            <br />
            Corporate Culture · corpculture.co · {CONTACT_EMAIL} · {WHATSAPP_DISPLAY}
          </p>
        </div>
      </div>
    </main>
  );
}
