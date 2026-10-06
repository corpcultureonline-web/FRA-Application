import { ALL_QUESTIONS, type Answers, type Profile } from "./audit";
import {
  DO_NOW,
  GATE_REASONS,
  LADDER,
  LEGAL,
  PILLAR_SUBTITLES,
  TOLD,
  VERDICTS,
  WEAKEST_LINES,
} from "./content";
import type { AreaStatus } from "./scoring/engine";
import type { PublicScore } from "./scoring/public";

/** Text fields may use **bold** markup; the result screen renders it as <strong>. */
export type NoteKind = "strength" | "milestone" | "watch";

export type AuditResult = {
  brandName: string;
  meta: string;
  email: string;
  range: PublicScore["range"];
  /** Level badge — bands spanned by the range, highest first. */
  levels: { code: string; name: string }[];
  gateReason: string | null;
  verdict: string;
  toldUs: string[];
  areas: { code: string; name: string; question: string; status: AreaStatus | null; weakest: boolean }[];
  weakest: { name: string; line: string } | null;
  legal: { kind: NoteKind; text: string }[];
  doNow: { actions: { title: string; body: string }[]; fallback: string | null };
  /** Areas not rated Good — "which of your N weak areas to fix first". */
  areasToFix: number;
  ladder: { code: string; name: string; body: string; yours: boolean }[];
};

/** Saved in the browser after a successful submit; the result page reads it. */
export type SavedSubmission = {
  version: 2;
  id?: number;
  profile: Profile;
  answers: Answers;
  score: PublicScore;
  submittedAt: string;
  interested?: boolean;
};

export const RESULT_STORAGE_KEY = "fra-audit-result";

/** "12–18 months" → "12 to 18 months"; "Less than 10%" → "less than 10%". */
function phrase(answer: string) {
  const text = answer.replace(/\s*–\s*/g, " to ");
  return /^(Less|More) than/.test(text) ? text[0].toLowerCase() + text.slice(1) : text;
}

function enquiries(answer: string) {
  if (answer === "0") return "**Nobody** asked you about a franchise last year";
  const count = phrase(answer).replace(/^more/, "More");
  return `**${count} people** asked you about a franchise last year`;
}

/** Plain restatement of the answers, one fixed line per option. */
function toldUs(profile: Profile, a: Answers): string[] {
  const lookup = <T extends Record<string, string>>(table: T, key: string) =>
    (table as Record<string, string>)[key];
  const authority = ALL_QUESTIONS.find((q) => q.id === "FL01")!.options.indexOf(a.FL01);

  return [
    `Each outlet earns back its cost in **${phrase(a.UE01)}**, at a margin of **${phrase(a.UE02)}**`,
    `Your operating procedures are ${lookup(TOLD.procedures, a.OR01)}, and ${lookup(TOLD.sopShare, a.OR02)} core workflows have an SOP a new manager could follow`,
    lookup(TOLD.partner, a.PP01),
    lookup(TOLD.training, a.SI01),
    TOLD.authority[Math.max(authority, 0)],
    `You have tested your business in ${lookup(TOLD.cities, a.MR01)}${a.MR01 === "1" ? ` — ${profile.city}` : ""}`,
    enquiries(a.BP01),
  ].filter(Boolean);
}

const STATUS_ORDER: Record<AreaStatus, number> = { Good: 0, Average: 1, Weak: 2 };

export function buildResult(
  profile: Profile,
  answers: Answers,
  score: PublicScore,
  submittedAt: Date,
): AuditResult {
  const month = submittedAt.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const outlets = `${profile.outlets} outlet${profile.outlets === "1" ? "" : "s"}`;

  // Good → Average → Weak, as in the design; register order within a status.
  const areas = score.areas
    .map((area, index) => ({ area, index }))
    .sort(
      (x, y) =>
        (x.area.status ? STATUS_ORDER[x.area.status] : 3) -
          (y.area.status ? STATUS_ORDER[y.area.status] : 3) || x.index - y.index,
    )
    .map(({ area }) => ({
      code: area.code,
      name: area.name,
      question: PILLAR_SUBTITLES[area.code],
      status: area.status,
      weakest: area.code === score.weakest,
    }));

  const weakestArea = score.areas.find((a) => a.code === score.weakest);
  const hasDispute = score.gateReasons.includes("dispute");
  const noTrademark = score.gateReasons.includes("noTrademark");

  const legal: AuditResult["legal"] = [];
  if (hasDispute) legal.push({ ...LEGAL.DISPUTE });
  if (noTrademark) legal.push({ ...LEGAL.TRADEMARK });
  if (!legal.length) legal.push({ ...LEGAL.CLEAN });

  const actions = [
    ...(hasDispute ? [DO_NOW.dispute] : []),
    ...(noTrademark ? [DO_NOW.noTrademark] : []),
  ];

  return {
    brandName: profile.brandName,
    meta: [profile.category, outlets, profile.city, month].join(" · "),
    email: profile.email,
    range: score.range,
    levels: score.levels,
    gateReason: hasDispute ? GATE_REASONS.dispute : noTrademark ? GATE_REASONS.noTrademark : null,
    verdict: VERDICTS[score.band.code],
    toldUs: toldUs(profile, answers),
    areas,
    weakest: weakestArea ? { name: weakestArea.name, line: WEAKEST_LINES[weakestArea.code] } : null,
    legal,
    doNow: { actions, fallback: actions.length ? null : DO_NOW.fallback },
    areasToFix: score.areas.filter((a) => a.status && a.status !== "Good").length,
    ladder: score.ladder.map((band) => ({
      ...band,
      body: LADDER[band.code] ?? "",
      yours: score.levels.some((level) => level.code === band.code),
    })),
  };
}
