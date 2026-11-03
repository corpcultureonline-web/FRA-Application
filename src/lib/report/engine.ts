/**
 * The Report's scoring engine (Tier 2). SERVER ONLY: it reads the option points
 * and numeric maps that never reach a page (Questionnaire §5, HANDOFF §14.2).
 *
 * Pillar scores use every answer the brand has given across both instruments —
 * the eleven Audit answers carried in (P11) and the Report's own — with the
 * Audit's weights, bands and status edges, so the two can never use
 * different rules. Arithmetic is exact (rational), as in the Audit engine.
 *
 * Rules, by source:
 * - A NULL is excluded from a pillar's sum and count, never scored 0 (S6, T44).
 *   "Not applicable" and "prefer not" are NULL; "I don't know" is NULL for the
 *   score and raised as a measurement flag (Strings S-1, S-5).
 * - Fewer than three scored answers: not assessed, no score, out of the gap
 *   ranking and the overall (T46). Unreachable on today's set (T81).
 * - Overall: weighted mean over assessed pillars (renormalised).
 * - Gaps: weight × (100 − score), ties in canonical order (D8, D19).
 * - Gap severity, by the pillar's own score: ≤50 Major, ≤70 Moderate, ≤85
 *   Minor, above that no gap line (Group D, read upper-bound inclusive, D21).
 * - Band margin: stated when the score is within one point of a band edge (D24).
 */
import type { Answers } from "../questionnaire/rules.ts";
import { add, cmp, div, mul, parseDecimal, rat, sub, toFixed, type Rational } from "../scoring/rational.ts";
import type { AnswerMap, AreaStatus, ScoringConfig } from "../scoring/engine.ts";

const HUNDRED = rat(100);
const FIVE = rat(5);
const CANONICAL = ["UE", "OR", "SI", "FL", "MR", "BP", "PP"];
const canonical = (code: string) => CANONICAL.indexOf(code);
/** T46: a pillar needs at least this many scored answers to be scored. */
export const ASSESSED_MIN = 3;

/** How a Report question turns into 1–5 points, read from Tier2-Questionnaire-Strings.md. */
export type PointsRule =
  | { kind: "options"; points: (number | null)[] }
  | { kind: "numeric"; edges: { atMost: number; points: number }[]; otherwise: number };

/** "**14a. …** *(MR5 · asked only when …)*" — the conditional questions number 7a, 14a and 20a (Strings v1.2). */
const STEM = /^\*\*\d+[a-z]?\. .+?\*\* \*\(([A-Za-z0-9]+)(?: — anchored)?(?: · [^)]*)?\)\*/;

/**
 * Answers the Report scores but does not ask (build spec §2.2, Strings v1.2):
 * a single-outlet brand's `MR5` derives to 1 from the Audit profile — a real,
 * scored value, unlike `OR6`, which is simply null when not asked.
 */
export function withDerived(answers: Answers, brand: { multiOutlet: boolean }): Answers {
  if (brand.multiOutlet || answers.MR5) return answers;
  return { ...answers, MR5: { option: null, number: 1, escape: null, computed: false } };
}

/**
 * Option points ("- Yes `5` · Partial `3` · No `1`", or one option per line,
 * or "1. …" for the anchored five, which score 1–5 in order) and numeric maps
 * ("`<=5 → 1 · <=10 → 2 · … · else 5`"). The legal questions carry none.
 */
export function parsePoints(markdown: string): Map<string, PointsRule> {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const end = lines.findIndex((line) => line.startsWith("# Test cases"));
  const rules = new Map<string, PointsRule>();
  let code: string | null = null;
  let options: (number | null)[] = [];
  let anchored = 0;

  const close = () => {
    if (code && !rules.has(code)) {
      if (anchored) rules.set(code, { kind: "options", points: Array.from({ length: anchored }, (_, i) => i + 1) });
      else if (options.length && options.some((p) => p !== null)) rules.set(code, { kind: "options", points: options });
    }
    code = null;
    options = [];
    anchored = 0;
  };

  for (const line of lines.slice(0, end === -1 ? undefined : end)) {
    const stem = STEM.exec(line);
    if (stem) {
      close();
      code = stem[1];
      continue;
    }
    if (!code) continue;
    if (line.startsWith("## ") || line === "---") {
      close();
    } else if (line.startsWith("`<=")) {
      const map = /^`([^`]+)`/.exec(line)![1];
      const edges = [...map.matchAll(/<=\s*(-?[\d.]+)\s*→\s*(\d)/g)].map((m) => ({ atMost: Number(m[1]), points: Number(m[2]) }));
      const otherwise = Number(/else\s+(\d)/.exec(map)![1]);
      rules.set(code, { kind: "numeric", edges, otherwise });
    } else if (line.startsWith("- ")) {
      const body = line.slice(2).replace(/\s+—\s+\*[^*]*\*\s*$/, "");
      for (const part of body.split(" · ")) {
        const points = /`(\d)`\s*$/.exec(part);
        options.push(points ? Number(points[1]) : null);
      }
    } else if (/^\d+\. /.test(line)) {
      anchored += 1;
    }
  }
  close();
  return rules;
}

export function pointsFor(rule: PointsRule | undefined, answer: Answers[string]): number | null {
  if (!rule || !answer || answer.escape) return null;
  if (rule.kind === "numeric") {
    if (answer.number === null) return null;
    return rule.edges.find((edge) => answer.number! <= edge.atMost)?.points ?? rule.otherwise;
  }
  return answer.option === null ? null : (rule.points[answer.option] ?? null);
}

export type Severity = "Major" | "Moderate" | "Minor";

export type PillarOutcome = {
  code: string;
  name: string;
  displayName: string;
  weight: Rational;
  /** Scored answers behind it, Audit and Report together. */
  count: number;
  assessed: boolean;
  /** null when not assessed. */
  score: Rational | null;
  status: AreaStatus | null;
  /** The band (B1–B5) the pillar score sits in: Group C's diagnosis is chosen by it. */
  band: string | null;
  severity: Severity | null;
};

export type ReportScore = {
  configVersion: string;
  overall: Rational;
  /** The band the overall score sits in. No gate moves it in the Report. */
  band: string;
  pillars: PillarOutcome[];
  /** Assessed pillars by gap, largest first, with no line above 85 (Group D). */
  gaps: string[];
  strongest: string | null;
  /** Distance to the band edges when within one point of either (D24). */
  margin: { below: Rational | null; above: Rational | null } | null;
  /** Questions answered "I don't know" — named in the Report, not scored (T44). */
  dontKnow: string[];
};

function bandIndex(config: ScoringConfig, value: Rational) {
  const index = config.bands.findIndex((band) => cmp(value, parseDecimal(band.max)) <= 0);
  return index === -1 ? config.bands.length - 1 : index;
}

function statusOf(config: ScoringConfig, value: Rational): AreaStatus {
  if (cmp(value, parseDecimal(config.status.weakMax)) <= 0) return "Weak";
  if (cmp(value, parseDecimal(config.status.averageMax)) <= 0) return "Average";
  return "Good";
}

function severityOf(value: Rational): Severity | null {
  if (cmp(value, rat(50)) <= 0) return "Major";
  if (cmp(value, rat(70)) <= 0) return "Moderate";
  if (cmp(value, rat(85)) <= 0) return "Minor";
  return null;
}

export function scoreReport({
  config,
  audit,
  answers,
  points,
}: {
  config: ScoringConfig;
  /** The Audit's answers by code, as option labels (UE01 … FL01, G1, G3). */
  audit: AnswerMap;
  /** The Report questionnaire's answers. */
  answers: Answers;
  points: Map<string, PointsRule>;
}): ReportScore {
  const values = new Map<string, number[]>(config.pillars.map((p) => [p.code, []]));

  for (const question of config.questions) {
    if (!question.pillar) continue;
    const value = question.options.find((option) => option.label === audit[question.code])?.value;
    if (value != null) values.get(question.pillar)!.push(value);
  }
  for (const [code, rule] of points) {
    const pillar = code.slice(0, 2);
    const value = pointsFor(rule, answers[code]);
    if (value !== null && values.has(pillar)) values.get(pillar)!.push(value);
  }

  const pillars: PillarOutcome[] = config.pillars.map((pillar) => {
    const list = values.get(pillar.code)!;
    const assessed = list.length >= ASSESSED_MIN;
    const score = assessed ? mul(div(div(rat(list.reduce((a, b) => a + b, 0)), rat(list.length)), FIVE), HUNDRED) : null;
    return {
      code: pillar.code,
      name: pillar.name,
      displayName: pillar.displayName,
      weight: parseDecimal(pillar.weight),
      count: list.length,
      assessed,
      score,
      status: score ? statusOf(config, score) : null,
      band: score ? config.bands[bandIndex(config, score)].code : null,
      severity: score ? severityOf(score) : null,
    };
  });

  const scored = pillars.filter((p): p is PillarOutcome & { score: Rational } => p.score !== null);
  if (!scored.length) throw new Error("No pillar could be assessed.");
  const overall = div(
    scored.reduce((sum, p) => add(sum, mul(p.score, p.weight)), rat(0)),
    scored.reduce((sum, p) => add(sum, p.weight), rat(0)),
  );

  // The Audit's gates cap its band; the Report's band is the score's (Group I §4.0, spec §7).
  // G1 and G3 are reported as non-negotiables instead.
  const scoreBandIndex = bandIndex(config, overall);

  const gap = (p: (typeof scored)[number]) => mul(p.weight, sub(HUNDRED, p.score));
  const gaps = [...scored]
    .filter((p) => p.severity !== null)
    .sort((a, b) => cmp(gap(b), gap(a)) || canonical(a.code) - canonical(b.code))
    .map((p) => p.code);
  const strongest = [...scored].sort(
    (a, b) => cmp(b.score, a.score) || cmp(b.weight, a.weight) || canonical(a.code) - canonical(b.code),
  )[0];

  // D24: within one point of either edge of the band the score sits in.
  const lower = scoreBandIndex > 0 ? parseDecimal(config.bands[scoreBandIndex - 1].max) : null;
  const upper = scoreBandIndex < config.bands.length - 1 ? parseDecimal(config.bands[scoreBandIndex].max) : null;
  const below = lower ? sub(overall, lower) : null;
  const above = upper ? sub(upper, overall) : null;
  const near = (distance: Rational | null) => distance !== null && cmp(distance, rat(1)) <= 0;

  return {
    configVersion: config.version,
    overall,
    band: config.bands[scoreBandIndex].code,
    pillars,
    gaps,
    strongest: strongest?.code ?? null,
    margin: near(below) || near(above) ? { below, above } : null,
    dontKnow: Object.entries(answers)
      .filter(([, answer]) => answer?.escape === "dont_know")
      .map(([code]) => code),
  };
}

/** One decimal, as printed ("68.8"): the Report shows scores to one place. */
export const oneDecimal = (value: Rational) => toFixed(value, 1);
