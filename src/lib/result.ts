import type { Answers, Profile } from "./audit.ts";
import { buildFacts } from "./content/facts.ts";
import { selectContent, type ContentPiece, type NoteKind, type ReportContent, type SlotValues } from "./content/select.ts";
import { score, type AnswerMap, type AreaStatus, type ScoringConfig } from "./scoring/engine.ts";
import { toPublicScore, type PublicScore } from "./scoring/public.ts";

export type { NoteKind };

/**
 * Everything the result page and the PDF show — one shape for both, so they
 * can never drift. Public values only: no overall or pillar scores, no weights.
 * Every sentence comes from the Content Library (`content_piece`); text fields
 * may use **bold** markup, rendered as <strong>.
 */
export type ReportData = {
  token: string;
  brandName: string;
  meta: string;
  range: PublicScore["range"];
  /** Level badge — the outer bands the range touches, highest first (spec §5). */
  badge: string;
  areas: { code: string; name: string; question: string; status: AreaStatus | null }[];
  content: ReportContent;
  /** All five bands, highest first, with the brand's own marked. */
  ladder: { code: string; name: string; body: string; yours: boolean }[];
  interested: boolean;
  /** Whether a mobile number was left on the interest confirmation (never the number). */
  phoneGiven: boolean;
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

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"];
const STATUS_ORDER: Record<AreaStatus, number> = { Good: 0, Average: 1, Weak: 2 };

function listText(items: string[]) {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/**
 * Restatement slots (Content Library §1.3): the in-sentence form of each
 * chosen option, read from the *active* config so past reports gain improved
 * wording while their scores still come from the version they were saved under.
 */
function restatements(active: ScoringConfig, answers: AnswerMap, profile: Profile): SlotValues {
  const slots: Record<string, string | undefined> = {
    outlets_label: active.profile?.outlets?.find((o) => o.label === profile.outlets)?.restatement,
  };
  for (const question of active.questions) {
    const label = answers[question.code];
    slots[`${question.code}_label`] = question.options.find((o) => o.label === label)?.restatement;
  }
  return slots as SlotValues;
}

/**
 * Builds the result for a submission: scores the answers with the config they
 * were saved under, selects Content Library pieces by trigger, and keeps only
 * public values. Pure — the page, the PDF and the tests all go through here.
 */
export function buildReport({
  token,
  profile,
  answers,
  submittedAt,
  config,
  activeConfig,
  pieces,
  interested,
  phoneGiven,
  onError,
}: {
  token: string;
  profile: Profile;
  answers: AnswerMap;
  submittedAt: Date;
  /** The scoring config version the submission was scored with. */
  config: ScoringConfig;
  /** The active config, for display wording. */
  activeConfig: ScoringConfig;
  pieces: ContentPiece[];
  interested: boolean;
  phoneGiven: boolean;
  onError?: (msg: string) => void;
}): ReportData {
  const result = score(config, answers);
  const publicScore = toPublicScore(config, result);
  const facts = buildFacts(config, answers, profile, result);

  const weak = publicScore.areas.filter((a) => a.status === "Weak").map((a) => a.name);
  const content = selectContent(
    pieces,
    facts,
    {
      brand: profile.brandName,
      city: profile.city,
      low: String(publicScore.range.low),
      high: String(publicScore.range.high),
      band: publicScore.band.name,
      weakest_area: publicScore.areas.find((a) => a.code === publicScore.weakest)?.name,
      weak_count: NUMBER_WORDS[weak.length] ?? String(weak.length),
      weak_list: listText(weak) || undefined,
      ...restatements(activeConfig, answers, profile),
    },
    onError,
  );

  const month = submittedAt.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const outlets = `${profile.outlets} outlet${profile.outlets === "1" ? "" : "s"}`;
  const levels = publicScore.levels.map((level) => level.name);

  // Good → Average → Weak, as in the design; register order within a status.
  const areas = publicScore.areas
    .map((area, index) => ({ area, index }))
    .sort(
      (x, y) =>
        (x.area.status ? STATUS_ORDER[x.area.status] : 3) -
          (y.area.status ? STATUS_ORDER[y.area.status] : 3) || x.index - y.index,
    )
    .map(({ area }) => ({
      code: area.code,
      name: area.name,
      question: content.subtitles[area.code] ?? "",
      status: area.status,
    }));

  return {
    token,
    brandName: profile.brandName,
    meta: [profile.category, outlets, profile.city, month].join(" · "),
    range: publicScore.range,
    // Never all three: the ends define the span, the ladder shows each level.
    badge: (levels.length > 1 ? [levels[0], levels.at(-1)!] : levels).join(" – "),
    areas,
    content,
    ladder: publicScore.ladder.map((band) => ({
      ...band,
      body: content.ladder.bodies[band.code] ?? "",
      yours: publicScore.levels.some((level) => level.code === band.code),
    })),
    interested,
    phoneGiven,
  };
}
