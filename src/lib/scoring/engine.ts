/**
 * Tier 1 scoring engine — FRA Tier 1 Scoring Specification v1.0.
 *
 * A pure function of (config, answers). The config is seeded data loaded from
 * the database; nothing about weights, values or bands is hardcoded here.
 *
 * SERVER ONLY. The result contains the overall point score, which must never
 * reach the client (spec §4, decision D2). Send `toPublicScore()` instead.
 */
import {
  add,
  ceil,
  cmp,
  div,
  floor,
  mul,
  parseDecimal,
  rat,
  sub,
  toFixed,
  type Rational,
} from "./rational.ts";

export type ScoringConfig = {
  version: string;
  rangeHalfWidth: string;
  pillars: { code: string; name: string; displayName: string; weight: string }[];
  questions: {
    code: string;
    pillar: string | null;
    /** `restatement` is the option's in-sentence form for "What you told us" — display only. */
    options: { label: string; value: number | null; restatement?: string }[];
  }[];
  /** In-sentence forms of the unscored profile answers (e.g. outlets "1" → "one outlet"). */
  profile?: { outlets?: { label: string; restatement: string }[] };
  bands: { code: string; name: string; displayName: string; max: string }[];
  status: { weakMax: string; averageMax: string };
  gates: {
    dispute: { question: string; answer: string; band: string };
    noTrademark: { question: string; answer: string; capBand: string };
  };
};

/** Question code → chosen option label. Missing or null means skipped (NULL, never 0). */
export type AnswerMap = Record<string, string | null | undefined>;

export type AreaStatus = "Good" | "Average" | "Weak";

export type GateOutcome = "pass" | "capped" | "hard";

export type PillarResult = {
  code: string;
  weight: Rational;
  /** null when no question in the pillar was answered. */
  score: Rational | null;
  status: AreaStatus | null;
};

export type ScoreResult = {
  configVersion: string;
  /** SERVER ONLY — never serialise to a client, page or email. */
  overall: Rational;
  range: { low: number; high: number };
  /** Band containing the overall score, before gates. */
  scoreBand: string;
  /** scoreBand after gates; drives the verdict paragraph (spec §8). */
  band: string;
  /** Bands the displayed range spans, after gates, highest first (spec §5). */
  levels: string[];
  /** Bands the clamped range touches before any gate — `band_count` (Content Library §2). */
  rangeLevels: string[];
  gate: GateOutcome;
  gateReasons: ("dispute" | "noTrademark")[];
  pillars: PillarResult[];
  weakest: string | null;
  /** Pillar codes ordered by weight × (100 − score), largest gap first (spec §10). */
  gaps: string[];
};

const HUNDRED = rat(100);
const FIVE = rat(5);

/**
 * Canonical pillar order (D19, CANONICAL-VALUES §6). Ties are broken on this
 * explicitly — never by sort stability, which would silently follow whatever
 * order the config or a query happened to return.
 */
const CANONICAL_PILLARS = ["UE", "OR", "SI", "FL", "MR", "BP", "PP"];

function canonicalIndex(code: string) {
  const index = CANONICAL_PILLARS.indexOf(code);
  return index === -1 ? CANONICAL_PILLARS.length : index;
}

function bandIndexOf(config: ScoringConfig, score: Rational) {
  const index = config.bands.findIndex((band) => cmp(score, parseDecimal(band.max)) <= 0);
  return index === -1 ? config.bands.length - 1 : index;
}

function statusOf(config: ScoringConfig, score: Rational): AreaStatus {
  if (cmp(score, parseDecimal(config.status.weakMax)) <= 0) return "Weak";
  if (cmp(score, parseDecimal(config.status.averageMax)) <= 0) return "Average";
  return "Good";
}

/** Throws if an answer is not one of the question's options. */
export function validateAnswers(config: ScoringConfig, answers: AnswerMap) {
  for (const question of config.questions) {
    const answer = answers[question.code];
    if (answer == null) continue;
    if (!question.options.some((option) => option.label === answer)) {
      throw new Error(`Unknown answer for ${question.code}: ${answer}`);
    }
  }
}

export function score(config: ScoringConfig, answers: AnswerMap): ScoreResult {
  validateAnswers(config, answers);

  // 1. Pillar scores: (sum ÷ count ÷ 5) × 100 over answered questions only.
  const pillars: PillarResult[] = config.pillars.map((pillar) => {
    const values = config.questions
      .filter((question) => question.pillar === pillar.code)
      .map((question) => question.options.find((option) => option.label === answers[question.code]))
      .filter((option): option is { label: string; value: number } => option?.value != null)
      .map((option) => option.value);

    const pillarScore = values.length
      ? mul(div(div(rat(values.reduce((a, b) => a + b, 0)), rat(values.length)), FIVE), HUNDRED)
      : null;

    return {
      code: pillar.code,
      weight: parseDecimal(pillar.weight),
      score: pillarScore,
      status: pillarScore ? statusOf(config, pillarScore) : null,
    };
  });

  // 2. Overall, renormalised across pillars with at least one answer.
  const answered = pillars.filter((p): p is PillarResult & { score: Rational } => p.score !== null);
  if (!answered.length) throw new Error("No scored question was answered.");
  const weighted = answered.reduce((sum, p) => add(sum, mul(p.score, p.weight)), rat(0));
  const totalWeight = answered.reduce((sum, p) => add(sum, p.weight), rat(0));
  const overall = div(weighted, totalWeight);

  // 3. Range: floor(overall − h) … ceil(overall + h), kept within 0–100.
  const halfWidth = parseDecimal(config.rangeHalfWidth);
  const low = Math.max(0, Number(floor(sub(overall, halfWidth))));
  const high = Math.min(100, Number(ceil(add(overall, halfWidth))));

  // 4. Bands, then gates — gates change the band only, never scores or range.
  const scoreBandIndex = bandIndexOf(config, overall);
  let bandIndex = scoreBandIndex;
  const rangeIndexes = Array.from(
    { length: bandIndexOf(config, rat(high)) - bandIndexOf(config, rat(low)) + 1 },
    (_, i) => bandIndexOf(config, rat(low)) + i,
  );
  let levelIndexes = [...rangeIndexes];

  const gateReasons: ScoreResult["gateReasons"] = [];
  const { dispute, noTrademark } = config.gates;
  if (answers[dispute.question] === dispute.answer) {
    gateReasons.push("dispute");
    const forced = config.bands.findIndex((b) => b.code === dispute.band);
    bandIndex = forced;
    levelIndexes = [forced];
  }
  if (answers[noTrademark.question] === noTrademark.answer) {
    gateReasons.push("noTrademark");
    const cap = config.bands.findIndex((b) => b.code === noTrademark.capBand);
    bandIndex = Math.min(bandIndex, cap);
    levelIndexes = [...new Set(levelIndexes.map((i) => Math.min(i, cap)))];
  }
  const gate: GateOutcome = gateReasons.includes("dispute")
    ? "hard"
    : gateReasons.length
      ? "capped"
      : "pass";

  // 5. Weakest pillar: lowest score; ties go to the higher weight (spec §9, D13),
  //    then canonical order.
  const byWeakness = [...answered].sort(
    (a, b) =>
      cmp(a.score, b.score) || cmp(b.weight, a.weight) || canonicalIndex(a.code) - canonicalIndex(b.code),
  );

  // 6. Gap ranking: weight × (100 − score), largest first; ties in canonical
  //    order as an explicit second key (spec §10, D19). Not the same pillar as
  //    the weakest, often.
  const gap = (p: (typeof answered)[number]) => mul(p.weight, sub(HUNDRED, p.score));
  const gaps = [...answered]
    .sort((a, b) => cmp(gap(b), gap(a)) || canonicalIndex(a.code) - canonicalIndex(b.code))
    .map((p) => p.code);

  return {
    configVersion: config.version,
    overall,
    range: { low, high },
    scoreBand: config.bands[scoreBandIndex].code,
    band: config.bands[bandIndex].code,
    levels: levelIndexes.sort((a, b) => b - a).map((i) => config.bands[i].code),
    rangeLevels: rangeIndexes.sort((a, b) => b - a).map((i) => config.bands[i].code),
    gate,
    gateReasons,
    pillars,
    weakest: byWeakness[0]?.code ?? null,
    gaps,
  };
}

/** The overall score as a DECIMAL(5,2) string, for the database only. */
export function overallForStorage(result: ScoreResult) {
  return toFixed(result.overall, 2);
}

export function pillarScoreForStorage(pillar: PillarResult) {
  return pillar.score ? toFixed(pillar.score, 2) : null;
}
