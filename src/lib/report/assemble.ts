/**
 * The Report, assembled (Screen 6, Stage 2). A pure function of the scores, the
 * answers and the libraries: it chooses blocks and fills slots, and writes no
 * sentence of its own (Report library §2, HANDOFF §14.1).
 *
 * The output is frozen when the founder submits and stored as it is; the page
 * and the PDF render that, never a fresh run (Report library §2, T70). Where a
 * library does not yet hold a string the Report needs, the slot is null and
 * `missing` names it, so the review panel can hold the Report back rather than
 * print a gap. `flags` names library text used as written that is known to be
 * stale or in conflict, for Ronak to see before he approves.
 *
 * Section order and numbering are R11's and Group I §6.1's; an absent section
 * is left out and nothing renumbers.
 */
import type { Answers } from "../questionnaire/rules.ts";
import { marginBand } from "../questionnaire/rules.ts";
import type { Question } from "../questionnaire/source.ts";
import { add, cmp, div, mul, parseDecimal, rat, sub, toFixed, type Rational } from "../scoring/rational.ts";
import type { AnswerMap, ScoringConfig } from "../scoring/engine.ts";
import { fill, type Paragraphs, type ReportContent, SEVERITY_CODE } from "./content.ts";
import { firedDetectors, SECTION_02_MAX, type Facts } from "./detectors.ts";
import { oneDecimal, pointsFor, type PillarOutcome, type PointsRule, type ReportScore } from "./engine.ts";

export const REPORT_SCHEMA = 1;

export type Profile = {
  brand: string;
  category: string;
  /** The Audit's outlets answer: "1", "2–5" … */
  outlets: string;
  city: string;
  rangeLow: number;
  rangeHigh: number;
};

export type Price = { headline: string; payable: string };

export type ToldUsItem = {
  code: string;
  /** Carried in from the Audit (Group I §5: tagged "Audit"). */
  audit: boolean;
  /** Group I §5's label; null where the library has none. */
  label: string | null;
  /** The answer exactly as he saw it: the option, the figure, or the escape he chose. */
  answer: string;
  declined: boolean;
};

export type PillarBlock = {
  code: string;
  displayName: string;
  name: string;
  subtitle: string | null;
  weight: string;
  /** One decimal; null when not assessed (T46). */
  score: string | null;
  status: string | null;
  assessed: boolean;
  /** B1–B5: which Group C block was chosen. Null when not assessed. */
  band: string | null;
  paragraphs: Paragraphs | null;
  toldUs: ToldUsItem[];
  /** `T2R-WEIGHT-INLINE`, filled: "20% weight" (Section 03's rows). */
  weightInline: string | null;
  /** `T2R-PILLAR-META`, filled: "20% of score · Average" (Section 06's blocks). */
  meta: string | null;
};

export type GapRow = {
  rank: number;
  code: string;
  displayName: string;
  name: string;
  severity: string;
  weight: string;
  score: string;
  line: string | null;
  /** Relative cost, 0–1, against the costliest gap (R14: a bar, no number). */
  cost: string;
};

export type GateState = "mustresolve" | "inprogress" | "clear";

/** One Section 05 row (Group I §4.5–4.7): every gate, always, in one of three states. */
export type GateItem = {
  gate: string;
  id: string;
  state: GateState;
  /** `T2R-MUSTRESOLVE`, `T2R-INPROGRESS`, `T2R-CLEAR`, or `T2R-HARDSTOP` on the one hardest gate. */
  marker: string | null;
  hardstop: boolean;
  title: string | null;
  paragraphs: Paragraphs | null;
};

export type Finding = { id: string; paragraphs: Paragraphs | null };

type Head = { number: string; title: string | null };

export type Section =
  | (Head & { number: "01"; intro: string | null; lead: Finding })
  | (Head & { number: "02"; intro: string | null; notes: Finding[] })
  | (Head & {
      number: "03";
      /** Desktop header row (`T2R-TH-*`): pillar, score out of 100, score, weight, status. */
      headers: { pillar: string | null; bar: string | null; score: string | null; weight: string | null; status: string | null };
      pillars: PillarBlock[];
      /** `T2R-GAPBAR-FOOT`: why the longest bar is not always the top-ranked gap. */
      barNote: string | null;
      /** `T2R-03-LEGALNOTE`. */
      legalNote: string | null;
      comparison: { title: string | null; paragraphs: (string | null)[] };
      noContradictions: string | null;
    })
  | (Head & { number: "04"; framing: Paragraphs | null; gaps: GapRow[] })
  | (Head & { number: "05"; intro: string | null; items: GateItem[] })
  | (Head & { number: "06"; intro: string | null; toldUsLabel: string | null; pillars: PillarBlock[] })
  | (Head & {
      number: "07";
      intro: string | null;
      hereLabel: string | null;
      rungs: { band: string; name: string; text: string | null; here: boolean }[];
      closing: string | null;
    })
  | (Head & { number: "08"; paragraphs: Paragraphs | null; footnote: string | null })
  | (Head & { number: "09"; paragraphs: Paragraphs | null })
  | (Head & {
      number: "10";
      heading: string | null;
      paragraphs: Paragraphs | null;
      price: Price;
      /** `T2R-CTA` "Tell me about the Roadmap": registers interest in place, no route (T127). */
      cta: string | null;
      /** `T2R-CTA-SUB`, under the button; stays visible after it is pressed. */
      ctaSub: string | null;
      /** `T2R-CTA-DONE`, which replaces the button once interest is registered. */
      ctaDone: string | null;
      /** `T2R-CTA-REVIEWED`: the card promises the Roadmap is reviewed (T117). */
      reviewed: string | null;
      contact: string | null;
      download: string | null;
      reviewer: {
        label: string | null;
        name: string | null;
        role: string | null;
        line: string | null;
        blurb: string | null;
        /** `T2R-STAT-1` … `-4`: "**₹100+ Cr** · Investments facilitated" → value and label. */
        stats: { value: string; label: string }[];
      };
    });

export type Tile = { label: string | null; value: string | null; caption: string | null };

export type ReportDocument = {
  schema: typeof REPORT_SCHEMA;
  generatedAt: string;
  configVersion: string;
  /** Library file → version used. */
  libraries: Record<string, string>;
  missing: string[];
  flags: string[];
  /** For the review panel and the events; never shown as a list of ids. */
  detectors: { fired: string[]; lead: string };
  cover: {
    brand: string;
    category: string;
    outlets: string;
    city: string;
    /** "October 2026": the Report is dated once, when it is made (Report library §6). */
    month: string;
    scoreLabel: string | null;
    outOf: string | null;
    overall: string;
    band: { code: string; name: string };
    /** `on`: the band's index; `position`: where the score sits along the whole scale, 0–1, bands drawn equal-width. */
    scale: { labels: string[]; on: number; position: string };
    final: string | null;
    /** `T2R-COVER-INTRO`, filled with the score (T107, T114). */
    explanation: string | null;
  };
  intro: Paragraphs | null;
  glance: Tile[];
  contents: Head[];
  sections: Section[];
  /** `T2R-DISCLAIMER`: the footer's lines. */
  disclaimer: string[] | null;
};

export type AssembleInput = {
  config: ScoringConfig;
  content: ReportContent;
  questions: Question[];
  points: Map<string, PointsRule>;
  score: ReportScore;
  audit: AnswerMap;
  answers: Answers;
  profile: Profile;
  price: Price;
  now: Date;
};

const CANONICAL = ["UE", "OR", "SI", "FL", "MR", "BP", "PP"];
const GATES = ["G1", "G2", "G3", "G4", "G5"];
const NUMBER_WORDS = ["None", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

/** Lower-cases a label's first letter for use mid-sentence, unless it opens an acronym ("EBITDA"). */
const midSentence = (text: string) => (/^[A-Z][A-Z]/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1));
const joinAnd = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const weightLabel = (weight: Rational) => toFixed(weight, 0);

/** "Indistinguishable. The customer experience does not…" → "Indistinguishable." Text with one sentence is unchanged. */
export const firstSentence = (text: string) => /^(.+?[.!?])(?=\s+[A-Z“"'(])/.exec(text)?.[1] ?? text;

/**
 * A numeric answer as he gave it, with its unit (§5.0): "9%", "4.5", "1,200",
 * and a day count against its window, "75 of 90 days". A figure, never a range.
 */
export function answerFigure(value: number, input: Question["input"]): string {
  const number = value.toLocaleString("en-IN", { maximumFractionDigits: input?.decimals ?? 0 });
  if (input?.suffix === "%") return `${number}%`;
  if (input?.suffix && input.max !== null) return `${number} of ${input.max.toLocaleString("en-IN")} ${input.suffix}`;
  if (input?.suffix) return `${number} ${input.suffix}`;
  return number;
}

export function assembleReport(input: AssembleInput): ReportDocument {
  const { config, content, questions, points, score, audit, answers, profile, price, now } = input;
  const missing: string[] = [];
  const flags: string[] = [];
  const need = <T>(value: T | undefined | null, what: string): T | null => {
    if (value === undefined || value === null || (typeof value === "string" && !value)) {
      missing.push(what);
      return null;
    }
    return value;
  };
  const key = (name: string) => need(content.keys.get(name), `${name} (no library string)`);
  const block = (id: string) => need(content.blocks.get(id), `${id} (Group I block)`);

  const byCode = new Map(questions.map((q) => [q.code, q]));
  const pillarOf = new Map(score.pillars.map((p) => [p.code, p]));
  const bandIdx = config.bands.findIndex((b) => b.code === score.band);
  const band = config.bands[bandIdx];
  const overall = oneDecimal(score.overall);

  // ---- Facts for the detectors -------------------------------------------------
  const reportPoints = (code: string) => pointsFor(points.get(code), answers[code]);
  const auditPoints = (code: string) =>
    config.questions.find((q) => q.code === code)?.options.find((o) => o.label === audit[code])?.value ?? null;
  const figure = (code: string) => {
    const answer = answers[code];
    return answer && !answer.escape && answer.number !== null ? answer.number : null;
  };
  const gate = (code: string): string | null => {
    if (code === "G1" || code === "G3") return audit[code] ?? null;
    const answer = answers[code];
    if (!answer) return null;
    if (answer.escape) return answer.escape;
    return answer.option === null ? null : (byCode.get(code)?.options[answer.option] ?? null);
  };
  const ue7 = figure("UE7");
  const margin = audit.UE02 ? marginBand(audit.UE02) : null;
  const dontKnow = score.dontKnow.length;
  const facts: Facts = {
    points: reportPoints,
    auditPoints,
    figure,
    gate,
    ue7InsideUe02:
      margin !== null && ue7 !== null && (margin.above === null || ue7 > margin.above) && (margin.atMost === null || ue7 <= margin.atMost),
    oneOutlet: profile.outlets === "1",
    dontKnow,
  };

  const fired = firedDetectors(facts);
  const lead = fired[0];

  // T99: never a fixed count. The Report's questions he answered plus the Audit's carried in.
  const nTotal = String(
    questions.filter((q) => answers[q.code]).length + config.questions.filter((q) => audit[q.code]).length,
  );

  // ---- Answers as he saw them (Group I §5.0, T135) --------------------------------
  const shown = (code: string): { answer: string; declined: boolean } | null => {
    const question = byCode.get(code);
    const answer = answers[code];
    if (!question || !answer) return null;
    if (answer.escape) return { answer: question.escape?.label ?? "", declined: true };
    if (answer.number !== null) return { answer: answerFigure(answer.number, question.input), declined: false };
    if (answer.option === null) return null;
    const option = question.options[answer.option];
    // Anchored: the option's first sentence, verbatim — "a prefix of the option selected or a bug".
    return { answer: question.type === "anchored" ? firstSentence(option) : option, declined: false };
  };

  const toldUs = (pillar: string): ToldUsItem[] => {
    const items: ToldUsItem[] = [];
    for (const question of questions.filter((q) => q.code.slice(0, 2) === pillar)) {
      const seen = shown(question.code);
      if (seen) items.push({ code: question.code, audit: false, label: need(content.labels.get(question.code), `"What you told us" label for ${question.code} (Group I §5)`), ...seen });
    }
    for (const question of config.questions.filter((q) => q.pillar === pillar)) {
      const label = audit[question.code];
      if (!label) continue;
      items.push({
        code: question.code,
        audit: true,
        label: need(content.labels.get(question.code), `"What you told us" label for the Audit's ${question.code} (Group I §5)`),
        // The Audit's options as he saw them; FL01's anchored descriptor to its first sentence, like every anchored answer (§5.0).
        answer: firstSentence(label),
        declined: false,
      });
    }
    return items;
  };

  // T46: Report library §4's block, with the pillar's name in its heading.
  const notAssessedBlock = (p: PillarOutcome): Paragraphs | null =>
    need(content.notAssessed, "T2R-NOTASSESSED-BLOCK (Report library §4)")?.map((line) => line.replace("{Pillar}", p.displayName)) ?? null;

  const weightInline = key("T2R-WEIGHT-INLINE");
  const pillarMeta = key("T2R-PILLAR-META");
  const notAssessedLabel = key("T2R-NOTASSESSED");
  const pillarBlock = (p: PillarOutcome): PillarBlock => ({
    code: p.code,
    displayName: p.displayName,
    name: p.name,
    subtitle: need(content.subtitles.get(p.code), `Pillar subtitle for ${p.code} (Group A §A2)`),
    weight: weightLabel(p.weight),
    score: p.score ? oneDecimal(p.score) : null,
    status: p.status,
    assessed: p.assessed,
    band: p.band,
    paragraphs: p.assessed ? need(content.diagnosis.get(`${p.code}:${p.band}`), `Group C block ${p.code} ${p.band}`) : notAssessedBlock(p),
    toldUs: toldUs(p.code),
    weightInline: weightInline ? fill(weightInline, { pct: weightLabel(p.weight) }) : null,
    // `{status}` is Section 03's vocabulary: Weak, Average, Good, or Not assessed (D11).
    meta: pillarMeta ? fill(pillarMeta, { pct: weightLabel(p.weight), status: p.status ?? notAssessedLabel ?? "" }) : null,
  });

  const pillars = CANONICAL.map((code) => pillarOf.get(code)).filter((p): p is PillarOutcome => Boolean(p));
  const blocks = pillars.map(pillarBlock);

  // ---- Section 05: every gate, in three states (Group I §4.5–4.7, T98, T103) ----------
  const STATES: Record<string, Record<string, [GateState, string]>> = {
    G1: { Registered: ["clear", "I-NN-G1-CLEAR"], "Application filed": ["inprogress", "I-NN-G1-FILED"], Neither: ["mustresolve", "I-NN-G1-NEITHER"] },
    G2: { Yes: ["clear", "I-NN-G2-CLEAR"], Partial: ["inprogress", "I-NN-G2-PARTIAL"], No: ["mustresolve", "I-NN-G2-NO"], dont_know: ["mustresolve", "I-NN-G2-DK"] },
    G3: { No: ["clear", "I-NN-G3-CLEAR"], Yes: ["mustresolve", "I-NN-G3-YES"] },
    G4: { Yes: ["clear", "I-NN-G4-CLEAR"], No: ["mustresolve", "I-NN-G4-NO"], dont_know: ["mustresolve", "I-NN-G4-DK"] },
    G5: { Yes: ["clear", "I-NN-G5-CLEAR"], Partial: ["inprogress", "I-NN-G5-PARTIAL"], No: ["mustresolve", "I-NN-G5-NO"], dont_know: ["mustresolve", "I-NN-G5-DK"] },
  };
  // T2R-HARDSTOP marks one row at most: the hardest gate present, the one its detector ranks highest.
  const hardGate = fired.find((detector) => detector.gate !== null && detector.kind !== "fallback")?.gate ?? null;
  const markers: Record<GateState, string | null> = {
    mustresolve: key("T2R-MUSTRESOLVE"),
    inprogress: key("T2R-INPROGRESS"),
    clear: key("T2R-CLEAR"),
  };
  const ORDER: GateState[] = ["mustresolve", "inprogress", "clear"];
  const gateItems: GateItem[] = GATES.flatMap((code) => {
    const value = gate(code);
    const state = value === null ? undefined : STATES[code][value];
    if (!state) {
      missing.push(`Section 05 row for ${code}: no state for the answer ${JSON.stringify(value)}`);
      return [];
    }
    const [kind, id] = state;
    const hardstop = kind === "mustresolve" && code === hardGate;
    return [
      {
        gate: code,
        id,
        state: kind,
        marker: hardstop ? key("T2R-HARDSTOP") : markers[kind],
        hardstop,
        title: need(content.gateTitles.get(code), `Section 05 row title for ${code} (Group I §6.5)`),
        paragraphs: block(id),
      },
    ];
  }).sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state) || GATES.indexOf(a.gate) - GATES.indexOf(b.gate));
  const outstanding = gateItems.filter((item) => item.state === "mustresolve");

  // ---- Section 02: contradictions that fired and did not lead -------------------
  const fills: Record<string, Record<string, string>> = {
    "LF-THIN-BASE": { rating: String(figure("BP3") ?? ""), n: String(figure("BP4") ?? "") },
    "LF-UNMEASURED": { n: NUMBER_WORDS[dontKnow]?.toLowerCase() ?? String(dontKnow) },
  };
  const finding = (id: string): Finding => {
    const paragraphs = block(id);
    return { id, paragraphs: paragraphs && fills[id] ? paragraphs.map((p) => fill(p, fills[id])) : paragraphs };
  };
  const notes = fired
    .slice(1)
    .filter((detector) => detector.kind === "contradiction")
    .slice(0, SECTION_02_MAX)
    .map((detector) => finding(detector.id));

  // ---- Section 01: the lead ------------------------------------------------------
  let leadFinding: Finding;
  if (lead.kind !== "fallback") {
    leadFinding = finding(lead.id);
  } else if (score.gaps.length) {
    const top = pillarOf.get(score.gaps[0])!;
    const id = `I-LEAD-${top.code}-${SEVERITY_CODE[top.severity!]}`;
    leadFinding = { id, paragraphs: block(id) };
  } else {
    leadFinding = { id: "I-LEAD-STRONG", paragraphs: block("I-LEAD-STRONG") };
    if (outstanding.length) {
      flags.push(
        'I-LEAD-STRONG says nothing raises a legal or structural blocker, but Section 05 has a gate to resolve (an "I don\'t know"). Group I has no lead for that case.',
      );
    }
  }

  // ---- Section 03: the comparison panel ------------------------------------------
  const low = rat(profile.rangeLow);
  const high = rat(profile.rangeHigh);
  let position: string;
  if (cmp(score.overall, high) > 0) position = content.position.above;
  else if (cmp(score.overall, low) < 0) position = content.position.below;
  else {
    // Fifths of the Audit range (Group I §3.1 "{where}"), bottom to top.
    const order = ["near the bottom of it", "a little below its midpoint", "close to its midpoint", "a little above its midpoint", "near the top of it"];
    const span = sub(high, low);
    const fifth = span.n === 0n ? 2 : Math.min(4, Math.floor(Number(toFixed(mul(div(sub(score.overall, low), span), rat(5)), 6))));
    const where = content.where.find((w) => w === order[fifth]) ?? null;
    position = fill(content.position.inside, { where: need(where, `{where} "${order[fifth]}" (Group I §3.1)`) ?? "{where}" });
  }
  const range = need(content.comparison.get("I-CMP-RANGE"), "I-CMP-RANGE");
  const rangeLine = range ? fill(range, { low: String(profile.rangeLow), high: String(profile.rangeHigh), n_total: nTotal, overall, position }) : null;

  // §3.2: rank every Report answer by weight × (value − 3); name three each way.
  const moved = questions
    .map((q, order) => {
      const value = reportPoints(q.code);
      const p = pillarOf.get(q.code.slice(0, 2));
      return value === null || !p ? null : { code: q.code, order, pull: mul(p.weight, rat(value - 3)) };
    })
    .filter((m): m is { code: string; order: number; pull: Rational } => m !== null);
  const named = (list: typeof moved) =>
    list.map((m) => need(content.labels.get(m.code), `Label for ${m.code} (Group I §5)`)).filter((l): l is string => l !== null).map(midSentence);
  const down = moved.filter((m) => m.pull.n < 0n).sort((a, b) => cmp(a.pull, b.pull) || a.order - b.order).slice(0, 3);
  const up = moved.filter((m) => m.pull.n > 0n).sort((a, b) => cmp(b.pull, a.pull) || a.order - b.order).slice(0, 3);
  const movedLine = (id: "I-CMP-DOWN" | "I-CMP-UP", list: typeof moved, n: string, items: string) => {
    if (!list.length) return null; // §3.2: the frame drops, never "nothing moved it".
    // T124: one answer takes its own frame, "One answer moved it down: …".
    const frameId = list.length === 1 ? `${id}-ONE` : id;
    const frame = need(content.comparison.get(frameId), frameId);
    return frame ? fill(frame, { [n]: NUMBER_WORDS[list.length], [items]: joinAnd(named(list)) }) : null;
  };

  // §3.1: three band frames — the top band has nothing above, the bottom nothing below.
  const lowerEdge = bandIdx > 0 ? parseDecimal(config.bands[bandIdx - 1].max) : rat(0);
  const upperEdge = parseDecimal(band.max);
  const next = config.bands[bandIdx + 1];
  const bandFrame = !next ? "I-CMP-BAND-TOP" : bandIdx === 0 ? "I-CMP-BAND-BOTTOM" : "I-CMP-BAND";
  const frame = need(content.comparison.get(bandFrame), bandFrame);
  const midpoint = div(add(lowerEdge, upperEdge), rat(2));
  const bandLine = frame
    ? fill(frame, {
        overall,
        half: cmp(score.overall, midpoint) > 0 ? "upper" : "lower",
        band: band.displayName,
        above: oneDecimal(sub(score.overall, lowerEdge)),
        below: oneDecimal(sub(upperEdge, score.overall)),
        nextband: next?.displayName ?? "",
      })
    : null;

  // ---- Section 04 -----------------------------------------------------------------
  const gapCost = (p: PillarOutcome) => mul(p.weight, sub(rat(100), p.score!));
  const maxCost = score.gaps.length ? gapCost(pillarOf.get(score.gaps[0])!) : rat(1);
  const gaps: GapRow[] = score.gaps.map((code, i) => {
    const p = pillarOf.get(code)!;
    return {
      rank: i + 1,
      code,
      displayName: p.displayName,
      name: p.name,
      severity: p.severity!,
      weight: weightLabel(p.weight),
      score: oneDecimal(p.score!),
      line: need(content.gapLines.get(`${code}:${p.severity}`), `Group D line ${code} ${p.severity}`),
      cost: toFixed(div(gapCost(p), maxCost), 3),
    };
  });

  // ---- Framing pieces --------------------------------------------------------------
  const piece = (id: string) => need(content.framing.get(id), `Group E ${id}`);
  /** E5 and E6 open with their own bold title; the section heading already says it. */
  const withoutTitle = (paragraphs: Paragraphs | null) =>
    paragraphs && /^\*\*[^*]+\*\*$/.test(paragraphs[0]) ? paragraphs.slice(1) : paragraphs;
  const e1 = piece("E1")?.map((p) => fill(p, { n_total: nTotal })) ?? null;
  const e6 = piece("E6");
  const e6Title = e6?.[0].match(/^\*\*(.+?)(?: — ₹[^*]*)?\*\*$/)?.[1] ?? null;
  if (e6?.some((p) => p.includes("₹"))) flags.push("E6 states the Roadmap price as a literal; the page renders it from config (CANONICAL-VALUES §1).");
  if (e6?.some((p) => p.includes("seventeen further questions"))) {
    flags.push(
      'E6 is the stale version ("seventeen further questions"). The v3.0 boards and the sample print different Section 10 text ("A further round of questions…" and a five-item list) that no library holds.',
    );
  }
  if (e6?.some((p) => /reviewed by an analyst/i.test(p))) {
    flags.push('E6 still says "reviewed by an analyst"; T117 replaced that promise on the card with T2R-CTA-REVIEWED, so the card says it twice in two voices.');
  }

  // ---- Glance strip (Report library §5: derived, never written) ---------------------
  const tile = (labelKey: string, label: string) => {
    const template = content.tiles.get(label);
    if (!template) missing.push(`Glance tile template "${label}" (Report library §5)`);
    return { label: key(labelKey), template };
  };
  const pillarTile = (labelKey: string, label: string, code: string | null): Tile => {
    const { label: shownLabel, template } = tile(labelKey, label);
    const p = code ? pillarOf.get(code) : undefined;
    if (!p?.score) {
      missing.push(`Glance tile "${label}" when there is no pillar to name`);
      return { label: shownLabel, value: null, caption: null };
    }
    const values = { pillar: p.displayName, score: oneDecimal(p.score), weight: weightLabel(p.weight) };
    return { label: shownLabel, value: template ? fill(template.value, values) : null, caption: template ? fill(template.caption, values) : null };
  };
  const scoreTile = (() => {
    const { label, template } = tile("T2R-TILE-SCORE", "Your score");
    const values = { overall, band: band.displayName };
    return { label, value: template ? fill(template.value, values) : null, caption: template ? fill(template.caption, values) : null };
  })();
  // Counts the Must resolve rows only, never all five (T101, Report library §5).
  const resolveTile = ((): Tile => {
    const { label, template } = tile("T2R-TILE-RESOLVE", "Must resolve");
    if (!outstanding.length) return { label, value: key("T2R-NOBLOCKERS"), caption: key("T2R-NOBLOCKERS-NOTE") };
    const titles = outstanding.map((item) => item.title ?? "");
    const listed = titles.length <= 3 ? titles : [...titles.slice(0, 2), `${titles.length - 2} more`];
    const joined = listed.map((title, i) => (i === 0 ? title : midSentence(title)));
    // T124: "1 item" at one — the numeral stays, the noun loses its s (Report library §5).
    const valueTemplate = outstanding.length === 1 ? (template?.valueOne ?? null) : (template?.value ?? null);
    if (outstanding.length === 1 && !valueTemplate) missing.push('The must-resolve tile\'s singular, "1 item" (Report library §5)');
    return {
      label,
      value: valueTemplate ? fill(valueTemplate, { n: String(outstanding.length) }) : null,
      caption: template ? template.caption.replace("{Section 05 row titles, joined}", joinAnd(joined)) : null,
    };
  })();
  const glance: Tile[] = [
    scoreTile,
    pillarTile("T2R-TILE-GAP", "Costliest gap", score.gaps[0] ?? null),
    pillarTile("T2R-TILE-BEST", "Strongest pillar", score.strongest),
    resolveTile,
  ];

  // ---- Sections, in R11's order -------------------------------------------------------
  const title = (n: string) => key(`T2R-SEC-${n}`);
  const sections: Section[] = [];
  sections.push({ number: "01", title: title("01"), intro: key("T2R-01-INTRO"), lead: leadFinding });
  if (notes.length) {
    // T124: one finding takes its own intro, never "One more places".
    const intro = key(notes.length === 1 ? "T2R-02-INTRO-ONE" : "T2R-02-INTRO");
    sections.push({ number: "02", title: title("02"), intro: intro ? fill(intro, { n: NUMBER_WORDS[notes.length] }) : null, notes });
  }
  sections.push({
    number: "03",
    title: title("03"),
    headers: {
      pillar: key("T2R-TH-PILLAR"),
      bar: key("T2R-TH-SCORE100"),
      score: key("T2R-TH-SCORE"),
      weight: key("T2R-TH-WEIGHT"),
      status: key("T2R-TH-STATUS"),
    },
    pillars: blocks,
    barNote: key("T2R-GAPBAR-FOOT"),
    legalNote: key("T2R-03-LEGALNOTE"),
    comparison: {
      title: key("T2R-VSFREE"),
      // DOWN and UP drop when there is nothing to name; RANGE and BAND stay, null if missing.
      paragraphs: [
        rangeLine,
        ...[movedLine("I-CMP-DOWN", down, "n_down", "list_down"), movedLine("I-CMP-UP", up, "n_up", "list_up")].filter((line) => line !== null),
        bandLine,
      ],
    },
    noContradictions: notes.length ? null : key("T2R-NOCONTRA"),
  });
  sections.push({ number: "04", title: title("04"), framing: piece("E3"), gaps });
  sections.push({ number: "05", title: title("05"), intro: key("T2R-05-INTRO"), items: gateItems });
  sections.push({ number: "06", title: title("06"), intro: key("T2R-06-INTRO"), toldUsLabel: key("T2R-TOLDUS"), pillars: blocks });
  sections.push({
    number: "07",
    title: title("07"),
    intro: need(content.ladder.get("LADDER-INTRO"), "LADDER-INTRO (Tier 1 result page §2)"),
    hereLabel: key("T2R-LADDER-HERE"),
    rungs: [...config.bands]
      .map((b, i) => ({
        band: b.code,
        name: b.displayName,
        text: need(content.ladder.get(`LADDER-${i + 1}`), `LADDER-${i + 1}`),
        here: b.code === score.band,
      }))
      .reverse(),
    closing: key("T2R-07-CLOSE"),
  });
  // E7 needs patterns from closed deals in the category; until the library has them, E8 (Group E §E7 rules).
  sections.push({ number: "08", title: title("08"), paragraphs: piece("E8"), footnote: key("T2R-08-FOOT") });
  sections.push({ number: "09", title: title("09"), paragraphs: withoutTitle(piece("E5")) });
  const stats = [1, 2, 3, 4]
    .map((i) => key(`T2R-STAT-${i}`))
    .filter((stat): stat is string => stat !== null)
    .map((stat) => {
      const [value, label] = stat.split(" · ");
      return { value: value.replace(/^\*\*(.+)\*\*$/, "$1"), label: label ?? "" };
    });
  sections.push({
    number: "10",
    title: title("10"),
    heading: e6Title,
    paragraphs: withoutTitle(e6),
    price,
    cta: key("T2R-CTA"),
    ctaSub: key("T2R-CTA-SUB"),
    ctaDone: key("T2R-CTA-DONE"),
    reviewed: key("T2R-CTA-REVIEWED"),
    contact: key("T2R-10-CONTACT"),
    download: key("T2R-DOWNLOAD"),
    reviewer: {
      label: key("T2R-BIO-LABEL"),
      name: key("T2R-BIO-NAME"),
      role: key("T2R-BIO-ROLE"),
      line: key("T2R-BIO-LINE"),
      blurb: key("T2R-BIO-BLURB"),
      stats,
    },
  });
  flags.push("Section 08 uses E8: no category has closed-deal patterns in the library yet (E7 is a template).");

  const outlets = config.profile?.outlets?.find((o) => o.label === profile.outlets)?.restatement ?? profile.outlets;
  // Every `need` runs before `missing` is read into the document.
  const coverIntro = key("T2R-COVER-INTRO");
  const disclaimer = key("T2R-DISCLAIMER")?.split(/<br\s*\/?>/i).map((line) => line.trim()) ?? null;
  const finalLabel = key("T2R-FINAL");
  const scoreLabel = key("T2R-SCORE-LABEL");
  const outOf = key("T2R-SCORE-OUTOF");
  if (content.scale.length !== config.bands.length) missing.push("T2R-SCALE-1 … -5 (Group I §6.2)");
  return {
    schema: REPORT_SCHEMA,
    generatedAt: now.toISOString(),
    configVersion: score.configVersion,
    libraries: content.versions,
    missing: [...new Set(missing)],
    flags: [...new Set(flags)],
    detectors: { fired: fired.map((d) => d.id), lead: leadFinding.id },
    cover: {
      brand: profile.brand,
      category: profile.category,
      outlets,
      city: profile.city,
      month: now.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }),
      scoreLabel,
      outOf,
      overall,
      band: { code: band.code, name: band.displayName },
      scale: {
        labels: content.scale,
        on: bandIdx,
        position: toFixed(div(add(rat(bandIdx), div(sub(score.overall, lowerEdge), sub(upperEdge, lowerEdge))), rat(config.bands.length)), 4),
      },
      final: finalLabel,
      explanation: coverIntro ? fill(coverIntro, { score: overall }) : null,
    },
    intro: e1,
    glance,
    contents: sections.map(({ number, title }) => ({ number, title })),
    sections,
    disclaimer,
  };
}
