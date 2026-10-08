import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import founderPhoto from "@/assets/ronak-patel.jpg";
import { Logo } from "@/components/Logo";
import { Rich } from "@/components/Rich";
import { BRAND_ENTITY_LINE, CONTACT_EMAIL, FOUNDER_STATS, WHATSAPP_DISPLAY } from "@/lib/company";
import type { NoteKind, ReportData } from "@/lib/result";
import { GetReportButton } from "./GetReportButton";

const caps = "text-[11px] font-bold uppercase tracking-[0.22em]";
const UPGRADE_ANCHOR = "full-report";

/**
 * The Tier 1 result, laid out as the approved sample PDF. The web result page
 * (ResultPage) has its own layout over the same ReportData, so the words cannot
 * drift; `print` swaps the interactive button for a link. Sections with no
 * selected content are left out entirely, heading and all (§1.4).
 */
export function ReportDocument({
  report,
  print = false,
  tier2Url,
  liveUrl,
}: {
  report: ReportData;
  print?: boolean;
  /** Tier 2 page, when it exists: "Get my full report" opens it. */
  tier2Url?: string;
  /** This report on the website, for the PDF's button while Tier 2 has no page. */
  liveUrl: string;
}) {
  const { content } = report;
  return (
    // Helvetica / Arial, as in the approved sample.
    <main
      className={`mx-auto w-full max-w-[820px] font-[Helvetica,Arial,sans-serif] text-ink ${
        print ? "" : "px-5 pt-8 pb-16 sm:px-8 sm:pt-12"
      }`}
    >
      <Masthead />

      <p className={`${caps} mt-8 font-medium text-muted`}>Franchise Readiness Audit — Preliminary result</p>
      <h1 className="mt-2 text-[30px] leading-tight font-extrabold tracking-tight sm:text-[36px]">
        {report.brandName}
      </h1>
      <p className="mt-1.5 text-[15px] text-muted">{report.meta}</p>

      <ScoreCard report={report} />

      {content.toldUs.length ? (
        <Section title="What You Told Us">
          <Bullets items={content.toldUs} />
        </Section>
      ) : null}

      {content.noticed.length ? (
        <Section title="What We Noticed">
          <Numbered items={content.noticed} />
        </Section>
      ) : null}

      <Section title="Your Score in Each Area">
        <AreaTable report={report} />
      </Section>

      {content.legal.length ? (
        <Section title="Legal Check">
          <Notes notes={content.legal} />
        </Section>
      ) : null}

      {content.importantPoints.length ? (
        <Section title="Important Points to Note">
          <Notes notes={content.importantPoints} />
        </Section>
      ) : null}

      {content.nutshell.length ? (
        <Section title="In a Nutshell">
          <div className="rounded-sm bg-[#f3f4f6] px-6 py-4">
            <Bullets items={content.nutshell} />
          </div>
        </Section>
      ) : null}

      {content.cannotTell ? (
        <Section title="What This Test Cannot Tell You">
          {content.cannotTell.intro ? <p className="mb-4 leading-relaxed text-body">{content.cannotTell.intro}</p> : null}
          <Numbered items={content.cannotTell.items} />
          {content.cannotTell.close ? (
            <p className="mt-4 leading-relaxed text-body">
              <Rich text={content.cannotTell.close} />
            </p>
          ) : null}
        </Section>
      ) : null}

      <Section title="Where You Sit on the Readiness Ladder">
        <Ladder report={report} />
      </Section>

      {content.canDoNow ? (
        <Section title="What You Can Do Now">
          <div className="space-y-3 rounded-sm border-l-4 border-l-cta bg-[#fdf6ee] px-6 py-5 leading-relaxed text-body">
            {content.canDoNow.lead ? <p>{content.canDoNow.lead}</p> : null}
            {content.canDoNow.actions.length ? (
              <ol className="space-y-3">
                {content.canDoNow.actions.map((action, i) => (
                  <li key={action.heading} className="break-inside-avoid">
                    <strong className="text-ink">
                      {i + 1}. {action.heading}
                    </strong>{" "}
                    {action.body}
                  </li>
                ))}
              </ol>
            ) : null}
            {content.canDoNow.fallback ? <p>{content.canDoNow.fallback}</p> : null}
          </div>
        </Section>
      ) : null}

      {/* The offer and Ronak's bio form one block, never split across pages (R8). */}
      <div className="break-inside-avoid">
        {content.upgrade ? (
          <Section title={content.upgrade.heading ?? "If You Want to Know Exactly Where You Stand"} id={UPGRADE_ANCHOR}>
            <Upgrade report={report} print={print} tier2Url={tier2Url} liveUrl={liveUrl} />
          </Section>
        ) : null}
        <Bio />
      </div>

      <p className="mt-8 border-t border-black/10 pt-4 text-[12px] leading-relaxed text-muted">
        This result is based on the answers you provided. It is a decision-support tool, not a guarantee of
        franchise success. Corporate Culture · corpculture.co · {CONTACT_EMAIL} · {WHATSAPP_DISPLAY}
        <br />
        {BRAND_ENTITY_LINE}
      </p>
    </main>
  );
}

function Masthead() {
  return (
    <header className="border-b-[3px] border-brand pb-3">
      <Link href="/" aria-label="Corporate Culture home">
        <Logo />
      </Link>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <p className="text-[11px] tracking-[0.3em] text-brand uppercase">Franchise. Fund. Scale.</p>
        <p className="text-[13px] text-muted">corpculture.co</p>
      </div>
    </header>
  );
}

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-9 scroll-mt-8">
      <h2 className="break-after-avoid border-b border-black/10 pb-2 text-[21px] leading-tight font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ScoreCard({ report }: { report: ReportData }) {
  return (
    <div className="mt-7 break-inside-avoid rounded-sm border border-l-4 border-black/10 border-l-brand px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className={`${caps} pt-1.5 font-medium text-muted`}>Your score</p>
        <div className="text-right">
          <p className="inline-block bg-brand px-3 py-1.5 text-[12px] font-bold tracking-[0.12em] text-white uppercase">
            {report.badge}
          </p>
          {report.content.gateReason ? (
            <p className="mt-2 max-w-[320px] text-[13px] text-brand-deep">
              <Rich text={report.content.gateReason} strongClass="text-brand-deep" />
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-[56px] leading-none font-black tracking-tight sm:text-[64px]">
        {report.range.low} – {report.range.high}
      </p>
      {report.content.scoreNote.length ? (
        <p className="mt-4 leading-relaxed text-body">{report.content.scoreNote.join(" ")}</p>
      ) : null}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((line) => (
        <li key={line} className="flex gap-2.5 leading-relaxed text-body">
          <span aria-hidden="true">•</span>
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
        <li key={item.heading} className="break-inside-avoid">
          <p className="font-bold">
            {i + 1}. {item.heading}
          </p>
          <p className="mt-1 leading-relaxed text-body">
            <Rich text={item.body} />
          </p>
        </li>
      ))}
    </ol>
  );
}

const NOTE_STYLES: Record<NoteKind, { label: string; border: string; text: string }> = {
  strength: { label: "Strength", border: "border-l-[#2e7d4f]", text: "text-[#2e7d4f]" },
  milestone: { label: "Next milestone", border: "border-l-cta", text: "text-[#b86e00]" },
  watch: { label: "Watch", border: "border-l-brand", text: "text-brand" },
};

function Notes({ notes }: { notes: { kind: NoteKind; text: string }[] }) {
  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        const style = NOTE_STYLES[note.kind];
        return (
          <li key={note.text} className={`break-inside-avoid border-l-[3px] py-0.5 pl-4 ${style.border}`}>
            <p className={`${caps} text-[10px] ${style.text}`}>{style.label}</p>
            <p className="mt-1 leading-relaxed text-body">
              <Rich text={note.text} />
            </p>
          </li>
        );
      })}
    </ul>
  );
}

const PILL_STYLES = {
  Good: "bg-[#e3f1e5] text-[#1b6b2f]",
  Average: "bg-[#fdeccf] text-[#8a5300]",
  Weak: "bg-[#fde4e1] text-[#b42318]",
};

function AreaTable({ report }: { report: ReportData }) {
  return (
    <table className="w-full text-left text-[15px]">
      <thead>
        <tr className="border-b-2 border-ink">
          <th className={`${caps} py-2 pr-3 text-[10px] text-muted`}>Area</th>
          <th className={`${caps} hidden py-2 pr-3 text-[10px] text-muted sm:table-cell`}>What it asks</th>
          <th className={`${caps} py-2 text-[10px] text-muted`}>Status</th>
        </tr>
      </thead>
      <tbody>
        {report.areas.map((area) => (
          <tr key={area.code} className="break-inside-avoid border-b border-black/10 align-middle">
            <td className="py-2.5 pr-3">
              <p className="font-bold">{area.name}</p>
              <p className="text-[14px] text-body sm:hidden">{area.question}</p>
            </td>
            <td className="hidden py-2.5 pr-3 text-body sm:table-cell">{area.question}</td>
            <td className="py-2.5">
              {area.status ? (
                <span className={`inline-block rounded-full px-3 py-0.5 text-[13px] font-bold ${PILL_STYLES[area.status]}`}>
                  {area.status}
                </span>
              ) : (
                <span className="text-sm text-muted">Not answered</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Ladder({ report }: { report: ReportData }) {
  const { intro, close } = report.content.ladder;
  return (
    <>
      {intro ? <p className="leading-relaxed text-body">{intro}</p> : null}
      <ol className="mt-4 space-y-2">
        {report.ladder.map((band) => (
          <li
            key={band.code}
            className={`grid break-inside-avoid gap-1 border-l-4 px-4 py-3 sm:grid-cols-[200px_1fr] sm:gap-6 ${
              band.yours ? "border-l-brand bg-[#fdf0ec]" : "border-l-[#e5e7eb]"
            }`}
          >
            <div>
              {band.yours ? <p className={`${caps} text-[10px] text-brand`}>Your range</p> : null}
              <p className={`font-bold ${band.yours ? "text-ink" : "text-muted"}`}>{band.name}</p>
            </div>
            <p className={`text-[15px] leading-relaxed ${band.yours ? "text-body" : "text-muted"}`}>{band.body}</p>
          </li>
        ))}
      </ol>
      {close ? <p className="mt-3 text-[14px] leading-relaxed text-muted">{close}</p> : null}
    </>
  );
}

const buttonClass =
  "mt-4 inline-flex items-center justify-center bg-brand px-6 py-3 font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-70";

/** The upgrade piece: paragraphs, "- " bullets and a "**₹…" price line. */
export function UpgradeBody({
  body,
  className = "",
  priceClass = "text-[26px] font-black text-brand",
}: {
  body: string;
  className?: string;
  priceClass?: string;
}) {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block) => {
        const lines = block.split("\n");
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={block} className="space-y-1.5">
              {lines.map((line) => (
                <li key={line} className="flex gap-2.5 leading-relaxed text-body">
                  <span aria-hidden="true">•</span>
                  <span>
                    <Rich text={line.slice(2)} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("**₹")) {
          return (
            <p key={block} className="pt-1 text-body">
              <Rich text={block} strongClass={priceClass} />
            </p>
          );
        }
        return (
          <p key={block} className="text-[15px] leading-relaxed text-muted">
            <Rich text={block} />
          </p>
        );
      })}
    </div>
  );
}

function Upgrade({
  report,
  print,
  tier2Url,
  liveUrl,
}: {
  report: ReportData;
  print: boolean;
  tier2Url?: string;
  liveUrl: string;
}) {
  const upgrade = report.content.upgrade!;

  return (
    <div className="border-2 border-ink px-6 py-6 sm:px-7">
      {upgrade.title ? <h3 className="text-xl font-bold">{upgrade.title}</h3> : null}
      <UpgradeBody body={upgrade.body} className="mt-2" />

      {tier2Url ? (
        <a href={tier2Url} className={buttonClass}>
          Get my full report
        </a>
      ) : print ? (
        <a href={`${liveUrl}#${UPGRADE_ANCHOR}`} className={buttonClass}>
          Get my full report
        </a>
      ) : (
        <GetReportButton
          token={report.token}
          interested={report.interested}
          phoneGiven={report.phoneGiven}
          className={buttonClass}
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
  );
}

function Bio() {
  return (
    <div className="mt-6 flex gap-5 border-t border-black/10 pt-5">
      <Image
        src={founderPhoto}
        alt="Ronak Patel"
        className="size-[72px] shrink-0 rounded-full object-cover object-top"
        sizes="72px"
      />
      <div className="min-w-0">
        <p className={`${caps} text-[10px] text-brand`}>Who conducts your audit</p>
        <p className="mt-0.5 text-xl font-bold">Ronak Patel</p>
        <p className="mt-2 text-[14px] leading-relaxed text-body">
          Corporate Culture has worked with consumer brands across F&amp;B, retail, lifestyle, wellness and
          education — helping them scale with structure, funding access and long-term expansion clarity. The
          seven-area framework behind this assessment comes from those engagements, and every audit is reviewed
          personally by Ronak.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {FOUNDER_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse justify-end">
              <dt className="mt-0.5 text-[10px] tracking-[0.15em] text-muted uppercase">{stat.label}</dt>
              <dd className="text-[22px] leading-none font-extrabold whitespace-nowrap text-brand">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
