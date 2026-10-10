/**
 * Server-built event payloads. Pure, so the tests can prove the overall score
 * never reaches the event log (Event-Log-Spec §4.3, Scoring Spec §4).
 */
import { BAND_KEYS } from "../content/facts.ts";
import type { AnswerMap, ScoreResult, ScoringConfig } from "../scoring/engine.ts";

/**
 * `audit_scored`: band, range, weakest pillar and gates — built field by field
 * from an allow-list, never by spreading the result, which holds `overall`.
 */
export function auditScoredPayload(config: ScoringConfig, result: ScoreResult, answers: AnswerMap) {
  return {
    band: BAND_KEYS[result.band] ?? result.band,
    low: result.range.low,
    high: result.range.high,
    weakest_pillar: result.weakest,
    weak_count: result.pillars.filter((p) => p.status === "Weak").length,
    band_count: result.rangeLevels.length,
    gate_g1: answers[config.gates.noTrademark.question] ?? null,
    gate_g3: answers[config.gates.dispute.question] ?? null,
    capped: result.gate !== "pass",
  };
}

/**
 * The browser sends a question's code and chosen label only — the option
 * values live in the scoring config beside the weights, which stay off the
 * client. The server adds `value` (1–5, or null for gates) before storing.
 */
export function withAnswerValues(config: ScoringConfig, type: string, payload: Record<string, unknown>) {
  if (type !== "question_answered" && type !== "answer_changed") return payload;
  const question = config.questions.find((q) => q.code === payload.code);
  const valueOf = (label: unknown) => question?.options.find((o) => o.label === label)?.value ?? null;
  return type === "question_answered"
    ? { ...payload, value: valueOf(payload.label) }
    : { ...payload, from_value: valueOf(payload.from_label), to_value: valueOf(payload.to_label) };
}
