import Image from "next/image";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import ronak from "@/assets/tier2/ronak-patel.png";
import { withBasePath } from "@/lib/base-path";
import { TIERS } from "@/lib/pricing";
import type { PillarBlock, ReportDocument, Section } from "@/lib/report/assemble";
import type { Paragraphs } from "@/lib/report/content";
import { SEVERITY_CODE, type Severity } from "@/lib/report/content";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { Inline, Prose } from "./Prose";
import { ReportNav, RoadmapInterest } from "./ReportNav";
import styles from "./report.module.css";

type Of<N extends Section["number"]> = Extract<Section, { number: N }>;

/**
 * Renders one editable piece (src/lib/report/pieces.ts). The founder's page
 * and the PDF print it; the review panel wraps it with its edit controls.
 * `pieceId` is the library block that filled the slot.
 */
export type RenderPiece = (slot: string, pieceId: string, paragraphs: Paragraphs | null, className: string) => ReactNode;

const plainPiece: RenderPiece = (_slot, _pieceId, paragraphs, className) => <Prose paragraphs={paragraphs} className={className} />;

/** "page": the founder's link · "print": what Chromium prints for the PDF · "review": the panel's left column. */
export type ReportMode = "page" | "print" | "review";

const status = (value: string | null) =>
  value === "Good" ? styles.chipGood : value === "Average" ? styles.chipAverage : value === "Weak" ? styles.chipWeak : styles.chipNa;

const MINOR = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to"]);

/**
 * T104: section titles are stored in sentence case; the H2 renders title case
 * ("How Your Score Is Built"), the contents list as stored. Styling, not a second string.
 */
const titleCase = (text: string) =>
  text
    .split(" ")
    .map((word, i) => (i > 0 && MINOR.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");

function SectionHead({ number, title }: { number: string; title: string | null }) {
  return (
    <div className={styles.sh}>
      <span className={styles.shNum}>{number}</span>
      <h2>{title && titleCase(title)}</h2>
    </div>
  );
}

function Download({ token, note }: { token: string; note: boolean }) {
  const label = plain(t2("T2R-DOWNLOAD"));
  return (
    <div className={styles.dl}>
      <a className={styles.dlbtn} href={withBasePath(`/report/my/${token}/pdf`)} download>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </a>
      {note && (
        <div className={styles.dlText}>
          <p className={styles.dlnote}>{plain(t2("T2R-DOWNLOAD-NOTE"))}</p>
          <p className={styles.priv}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>
              <Inline text={t2("T2R-PRIVATE")} />
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function Cover({ doc }: { doc: ReportDocument }) {
  const { cover } = doc;
  const meta = [cover.category, cover.outlets, cover.city, cover.month].filter(Boolean).join(" · ");
  return (
    <>
      <div className={styles.cover}>
        <span className={`${styles.mono} ${styles.eye}`}>{TIERS.report.name}</span>
        <h1>{cover.brand}</h1>
        <p className={styles.meta}>{meta}</p>
      </div>
      <div className={styles.score}>
        <div className={styles.scoreLeft}>
          {cover.scoreLabel && <span className={`${styles.mono} ${styles.eye}`}>{cover.scoreLabel}</span>}
          <div className={styles.row1}>
            <span className={styles.num}>
              {cover.overall}
              {cover.outOf && <small>{cover.outOf}</small>}
            </span>
          </div>
          {cover.final && <span className={`${styles.mono} ${styles.final}`}>{cover.final}</span>}
        </div>
        <div className={styles.scoreRight}>
          <span className={styles.badge}>{cover.band.name}</span>
          <div className={styles.scale} aria-hidden="true">
            <span className={styles.pin} style={{ left: `${Number(cover.scale.position) * 100}%` }}>
              <b>{cover.overall}</b>
              <i />
            </span>
            <div className={styles.segs}>
              {cover.scale.labels.map((_, i) => (
                <i key={i} className={i === cover.scale.on ? styles.on : undefined} />
              ))}
            </div>
            <div className={styles.labs}>
              {cover.scale.labels.map((label, i) => (
                <span key={label} className={i === cover.scale.on ? styles.on : undefined}>
                  {label}
                </span>
              ))}
            </div>
          </div>
          {cover.explanation && <p className={styles.explain}>{cover.explanation}</p>}
        </div>
      </div>
    </>
  );
}

function PillarRows({ pillars, headers }: { pillars: PillarBlock[]; headers: Of<"03">["headers"] }) {
  return (
    <div className={styles.ptab}>
      <div className={`${styles.mono} ${styles.thead}`} aria-hidden="true">
        <span>{headers.pillar}</span>
        <span>{headers.bar}</span>
        <span>{headers.score}</span>
        <span>{headers.weight}</span>
        <span>{headers.status}</span>
      </div>
      {pillars.map((p) => (
        <div key={p.code} className={styles.prow}>
          <span className={styles.prowName}>
            {p.displayName}
            <small>{p.name}</small>
          </span>
          {p.assessed ? (
            <>
              <span className={`${styles.track} ${styles[p.status ?? ""] ?? ""}`}>
                <i style={{ width: `${Number(p.score)}%` }} />
              </span>
              <span className={styles.prowScore}>{p.score}</span>
              <span className={styles.prowMeta}>
                <span>{p.weightInline}</span>
                <span className={`${styles.chip} ${status(p.status)}`}>{p.status}</span>
              </span>
            </>
          ) : (
            <>
              <span className={`${styles.track} ${styles.trackNa}`} />
              <span className={styles.prowScore} />
              <span className={styles.prowMeta}>
                <span>{p.weightInline}</span>
                <span className={`${styles.chip} ${styles.chipNa}`}>{plain(t2("T2R-NOTASSESSED"))}</span>
              </span>
              <span className={styles.naWhy}>{plain(t2("T2R-NOTASSESSED-WHY"))}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function PillarBlocks({ section, piece }: { section: Of<"06">; piece: RenderPiece }) {
  return (
    <>
      {section.pillars.map((p) => (
        <article
          key={p.code}
          id={`pillar-${p.code}`}
          className={`${styles.pb} ${p.assessed ? (styles[`pb${p.status}`] ?? "") : styles.pbNa}`}
        >
          <div className={styles.pbHead}>
            <h3>{p.displayName}</h3>
            {p.score && <span className={styles.pbScore}>{p.score}</span>}
            <p className={styles.pbSub}>
              {p.name}
              {p.subtitle && <span> — {p.subtitle}</span>}
            </p>
            {p.meta && <span className={`${styles.mono} ${styles.pbWeight}`}>{p.meta}</span>}
          </div>
          {piece(`06.${p.code}`, p.assessed ? `C-${p.code}-${p.band}` : "T2R-NOTASSESSED-BLOCK", p.paragraphs, styles.body)}
          {p.toldUs.length > 0 && (
            <div className={styles.told}>
              {section.toldUsLabel && <span className={`${styles.mono} ${styles.eye}`}>{section.toldUsLabel}</span>}
              <ul>
                {p.toldUs.map((item) => (
                  <li key={item.code} className={item.declined ? styles.declined : undefined}>
                    {/* Group I §5.0: the label in small caps, a space, then the answer as he saw it; Audit answers tagged. */}
                    <span>
                      {item.audit && <span className={styles.au}>Audit</span>}
                      {item.label && <span className={styles.lbl}>{item.label}</span>}{" "}
                      <span className={styles.ans}>{item.answer}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </>
  );
}

function Body({
  section,
  doc,
  token,
  mode,
  piece,
  roadmapInterest,
}: {
  section: Section;
  doc: ReportDocument;
  token: string;
  mode: ReportMode;
  piece: RenderPiece;
  roadmapInterest: boolean;
}) {
  switch (section.number) {
    case "01":
      return (
        <>
          {section.intro && <p className={styles.body}>{section.intro}</p>}
          {piece("01.lead", section.lead.id, section.lead.paragraphs, `${styles.body} ${styles.lead}`)}
        </>
      );
    case "02":
      return (
        <>
          {section.intro && <p className={styles.body}>{section.intro}</p>}
          {section.notes.map((note) => (
            <div key={note.id}>{piece(`02.${note.id}`, note.id, note.paragraphs, `${styles.body} ${styles.note}`)}</div>
          ))}
        </>
      );
    case "03":
      return (
        <>
          <PillarRows pillars={section.pillars} headers={section.headers} />
          {section.barNote && <p className={styles.dlnote}>{section.barNote}</p>}
          {section.legalNote && <p className={styles.dlnote}>{section.legalNote}</p>}
          <div className={styles.free}>
            {section.comparison.title && <h3>{section.comparison.title}</h3>}
            {piece("03.compare", "I-CMP", section.comparison.paragraphs.filter((p): p is string => Boolean(p)), styles.body)}
          </div>
          {section.noContradictions && <p className={styles.body}>{section.noContradictions}</p>}
        </>
      );
    case "04": {
      // "20% weight" is Section 03's T2R-WEIGHT-INLINE for the same pillar, so the two sections say it the same way.
      const three = doc.sections.find((s) => s.number === "03") as Of<"03"> | undefined;
      const weightOf = (code: string) => three?.pillars.find((p) => p.code === code)?.weightInline;
      return (
        <>
          {/* The board sets E3 in a tinted box above the ranked list. */}
          <div className={styles.gp}>{piece("04.framing", "E3", section.framing, styles.body)}</div>
          <ol className={styles.gaps}>
            {section.gaps.map((gap) => (
              <li key={gap.code} className={styles.gap}>
                <span className={styles.rank}>{gap.rank}</span>
                <span className={styles.gapHead}>
                  <b>{gap.displayName}</b>
                  <span className={`${styles.sev} ${styles[`sev${gap.severity}`] ?? ""}`}>{gap.severity}</span>
                </span>
                <span className={styles.gapMeta}>
                  {gap.name} · {weightOf(gap.code) ?? `${gap.weight}%`} · scored {gap.score}
                </span>
                {/* Always in the text column — in the review panel the line is wrapped in its edit controls. */}
                <div className={styles.gapBody}>
                  {piece(`04.${gap.code}`, `D-${gap.code}-${SEVERITY_CODE[gap.severity as Severity]}`, gap.line ? [gap.line] : null, styles.gapLine)}
                </div>
                <span className={styles.cost} aria-hidden="true">
                  <i style={{ width: `${Number(gap.cost) * 100}%` }} />
                </span>
              </li>
            ))}
          </ol>
        </>
      );
    }
    case "05":
      return (
        <>
          {section.intro && <p className={styles.body}>{section.intro}</p>}
          {section.items.map((item) => (
            <div key={item.gate} className={`${styles.nn} ${styles[`nn_${item.state}`] ?? ""}`}>
              {item.marker && <span className={styles.nnLabel}>{item.marker}</span>}
              {item.title && <h3 className={styles.nnTitle}>{item.title}</h3>}
              {piece(`05.${item.gate}`, item.id, item.paragraphs, styles.body)}
            </div>
          ))}
        </>
      );
    case "06":
      return (
        <>
          {section.intro && <p className={styles.body}>{section.intro}</p>}
          <PillarBlocks section={section} piece={piece} />
        </>
      );
    case "07":
      return (
        <>
          {section.intro && <p className={styles.body}>{section.intro}</p>}
          <ol className={styles.lad}>
            {section.rungs.map((rung) => (
              <li key={rung.band} className={`${styles.rung} ${rung.here ? styles.rungOn : ""}`} aria-current={rung.here ? "true" : undefined}>
                <span>
                  {rung.here && section.hereLabel && (
                    <span className={`${styles.mono} ${styles.here}`}>
                      {section.hereLabel} · {doc.cover.overall}
                      <br />
                    </span>
                  )}
                  <b>{rung.name}</b>
                </span>
                {rung.text && <p>{rung.text}</p>}
              </li>
            ))}
          </ol>
          {section.closing && <p className={styles.body}>{section.closing}</p>}
        </>
      );
    case "08":
      return (
        <>
          {piece("08", "E8", section.paragraphs, styles.body)}
          {section.footnote && <p className={styles.dlnote}>{section.footnote}</p>}
        </>
      );
    case "09":
      return <>{piece("09", "E5", section.paragraphs, styles.body)}</>;
    case "10":
      return (
        <>
          <div className={styles.rm}>
            {section.heading && <h3>{section.heading}</h3>}
            {piece("10", "E6", section.paragraphs, styles.body)}
            <p className={styles.price}>
              <span className={styles.amt}>{section.price.headline}</span>
              {/* Report library §5: "₹5,999 + 18% GST, ₹7,079 payable", from config. */}
              <span className={styles.pay}>{section.price.payable} payable</span>
            </p>
            {section.reviewed && <p className={styles.dlnote}>{section.reviewed}</p>}
            {/* T127: a button that registers interest in place; the PDF and the panel show it as printed. */}
            {section.cta &&
              (mode === "page" ? (
                <RoadmapInterest
                  token={token}
                  registered={roadmapInterest}
                  className={styles.cta}
                  doneClassName={styles.ctaDone}
                  label={<Inline text={section.cta} />}
                  done={<Inline text={section.ctaDone ?? ""} />}
                />
              ) : (
                <span className={styles.cta}>
                  <Inline text={section.cta} />
                </span>
              ))}
            {section.ctaSub && <p className={styles.dlnote}>{section.ctaSub}</p>}
          </div>
          {section.contact && <p className={styles.body}>{section.contact}</p>}
          {mode === "page" && (
            <div className={styles.endl}>
              <Download token={token} note={false} />
            </div>
          )}
          <div className={styles.who}>
            {section.reviewer.label && <span className={`${styles.mono} ${styles.eye} ${styles.whoLabel}`}>{section.reviewer.label}</span>}
            <Image src={ronak} alt={section.reviewer.name ?? ""} width={112} height={112} unoptimized />
            <div>
              {section.reviewer.name && <h3>{section.reviewer.name}</h3>}
              {section.reviewer.role && <p className={styles.whoRole}>{section.reviewer.role}</p>}
            </div>
            {section.reviewer.line && <p className={styles.whoLine}>{section.reviewer.line}</p>}
            {section.reviewer.blurb && <p className={styles.whoLine}>{section.reviewer.blurb}</p>}
            {section.reviewer.stats.length > 0 && (
              <dl className={styles.stats}>
                {section.reviewer.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt>{stat.value}</dt>
                    <dd className={styles.mono}>{stat.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </>
      );
  }
}

/**
 * The Report (Screen 6), one renderer for the founder's page, the PDF and the
 * review panel, so the three can never show different Reports (Report library
 * §10, Admin §3: "exactly as the founder would receive it").
 */
export function ReportView({
  doc,
  token,
  mode,
  piece = plainPiece,
  roadmapInterest = false,
}: {
  doc: ReportDocument;
  token: string;
  mode: ReportMode;
  piece?: RenderPiece;
  /** The founder has already asked about the Roadmap: Section 10 opens on T2R-CTA-DONE. */
  roadmapInterest?: boolean;
}) {
  const page = mode === "page";
  return (
    <div className={`${styles.page} ${mode === "print" ? styles.print : ""} ${mode === "review" ? styles.review : ""}`} id="top">
      {mode !== "review" && (
        <header className={styles.bar}>
          <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
        </header>
      )}
      <div className={styles.grid}>
        {page && (
          <ReportNav
            token={token}
            sections={doc.contents}
            copy={{ contents: plain(t2("T2R-CONTENTS")), close: plain(t2("T2R-CONTENTS-CLOSE-A11Y")), top: plain(t2("T2R-TOP")) }}
          />
        )}
        <main className={styles.main}>
          <Cover doc={doc} />
          {page && <Download token={token} note />}
          {piece("intro", "E1", doc.intro, styles.intro)}

          <ul className={styles.glance}>
            {doc.glance.map((tile, i) => (
              <li key={i} className={styles.tile}>
                {tile.label && <span className={`${styles.mono} ${styles.eye}`}>{tile.label}</span>}
                {tile.value && <span className={styles.tileValue}>{tile.value}</span>}
                {tile.caption && <span className={styles.tileCaption}>{tile.caption}</span>}
              </li>
            ))}
          </ul>

          {page && (
            <nav className={styles.toc} id="contents" aria-label={plain(t2("T2R-CONTENTS"))}>
              <span className={`${styles.mono} ${styles.eye}`}>{plain(t2("T2R-CONTENTS"))}</span>
              {doc.contents.map((s) => (
                <a key={s.number} className={styles.tocLink} href={`#s${s.number}`}>
                  <span className={styles.n}>{s.number}</span>
                  <span>{s.title}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
            </nav>
          )}

          {doc.sections.map((section) => (
            <section key={section.number} id={`s${section.number}`} data-section={section.number} className={styles.section}>
              <SectionHead number={section.number} title={section.title} />
              <Body section={section} doc={doc} token={token} mode={mode} piece={piece} roadmapInterest={roadmapInterest} />
            </section>
          ))}

          {page && (
            <a className={styles.top} href="#top">
              {plain(t2("T2R-TOP"))}
            </a>
          )}
        </main>
      </div>
      <footer className={styles.foot}>
        {doc.disclaimer ? (
          doc.disclaimer.map((line, i) => <p key={i}>{line}</p>)
        ) : (
          // The entity line is never dropped (P9, T2C-ENTITY), even before a disclaimer exists.
          <p>{plain(t2("T2C-ENTITY"))}</p>
        )}
      </footer>
    </div>
  );
}
