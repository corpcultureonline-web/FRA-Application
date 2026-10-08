import { ALL_QUESTIONS, type Answers, type Profile } from "./audit";
import { GATE_REASONS, LEGAL, PILLAR_SUBTITLES, TOLD, VERDICTS } from "./content";
import type { NoteKind, ReportContent } from "./content/select";
import type { AreaStatus } from "./scoring/engine";
import type { PublicScore } from "./scoring/public";

export type { NoteKind };

/**
 * Everything the result page and the PDF show — one shape for both, so they
 * can never drift. Public values only: no overall or pillar scores.
 * Text fields may use **bold** markup, rendered as <strong>.
 */
export type ReportData = {
  token: string;
  brandName: string;
  meta: string;
  range: PublicScore["range"];
  /** Level badge — bands spanned by the range, highest first. */
  levels: string[];
  gateReason: string | null;
  verdict: string;
  toldUs: string[];
  areas: { code: string; name: string; question: string; status: AreaStatus | null }[];
  legal: { kind: NoteKind; text: string }[];
  content: ReportContent;
  /** All five bands, highest first, with the brand's own marked. */
  ladder: { code: string; name: string; body: string; yours: boolean }[];
  interested: boolean;
};

/** Saved in the browser after a successful submit; /audit/result reads it. */
export type SavedSubmission = {
  version: 2;
  id?: number;
  /** Opens /audit/report/<token>, the result page itself. */
  reportToken?: string;
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

/** One card for the trademark, one for disputes — gate issues first. */
function legalCards(a: Answers): ReportData["legal"] {
  const dispute = a.G3 === "Yes" ? LEGAL.DISPUTE : LEGAL.NO_DISPUTE;
  const trademark =
    a.G1 === "Registered" ? LEGAL.TM_REGISTERED : a.G1 === "Application filed" ? LEGAL.TM_FILED : LEGAL.TRADEMARK;
  return [trademark, dispute]
    .sort((x, y) => Number(y.kind === "watch") - Number(x.kind === "watch"))
    .map((card) => ({ ...card }));
}

const STATUS_ORDER: Record<AreaStatus, number> = { Good: 0, Average: 1, Weak: 2 };

export function buildReportData({
  token,
  profile,
  answers,
  score,
  submittedAt,
  content,
  interested,
}: {
  token: string;
  profile: Profile;
  answers: Answers;
  score: PublicScore;
  submittedAt: Date;
  content: ReportContent;
  interested: boolean;
}): ReportData {
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
    }));

  const hasDispute = score.gateReasons.includes("dispute");
  const noTrademark = score.gateReasons.includes("noTrademark");

  return {
    token,
    brandName: profile.brandName,
    meta: [profile.category, outlets, profile.city, month].join(" · "),
    range: score.range,
    levels: score.levels.map((level) => level.name),
    gateReason: hasDispute ? GATE_REASONS.dispute : noTrademark ? GATE_REASONS.noTrademark : null,
    verdict: VERDICTS[score.band.code],
    toldUs: toldUs(profile, answers),
    areas,
    legal: legalCards(answers),
    content,
    ladder: score.ladder.map((band) => ({
      ...band,
      body: content.ladder.bodies[band.code] ?? "",
      yours: score.levels.some((level) => level.code === band.code),
    })),
    interested,
  };
}
