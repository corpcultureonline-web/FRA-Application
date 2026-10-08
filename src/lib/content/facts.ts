import { pillarScoreForStorage, type AnswerMap, type ScoreResult, type ScoringConfig } from "../scoring/engine.ts";
import type { Facts } from "./triggers.ts";

/** Library band names used in triggers, by engine band code. */
export const BAND_KEYS: Record<string, string> = {
  B1: "NOT_YET_READY",
  B2: "EARLY_STAGE",
  B3: "ALMOST_READY",
  B4: "READY_TO_PLAN",
  B5: "READY_TO_SCALE",
};

export type ProfileFacts = { outlets: string; category: string; city: string };

/**
 * Everything a trigger can read (Content Library §1.2). Answers are the
 * option value (1–5), gates the option label, the outlet band stays text.
 * Pillar scores feed triggers only — they never reach a page or a slot.
 */
export function buildFacts(
  config: ScoringConfig,
  answers: AnswerMap,
  profile: ProfileFacts,
  result: ScoreResult,
): Facts {
  const facts: Facts = {
    outlets: profile.outlets || null,
    category: profile.category || null,
    city: profile.city || null,
    // Not collected by the Tier 1 audit.
    year_opened: null,
    band: BAND_KEYS[result.band] ?? null,
    low: result.range.low,
    high: result.range.high,
    weakest_pillar: result.weakest,
    weak_count: result.pillars.filter((p) => p.status === "Weak").length,
    band_count: result.levels.length,
  };

  for (const question of config.questions) {
    const label = answers[question.code] ?? null;
    if (question.pillar === null) {
      facts[question.code] = label;
    } else {
      facts[question.code] = question.options.find((o) => o.label === label)?.value ?? null;
    }
  }

  for (const pillar of result.pillars) {
    const score = pillarScoreForStorage(pillar);
    facts[pillar.code] = score === null ? null : Number(score);
  }

  return facts;
}
