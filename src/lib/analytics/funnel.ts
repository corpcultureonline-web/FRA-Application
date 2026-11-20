/**
 * Where an app path sits in the funnel, for Clarity's tier and stage tags
 * (Instrumentation handoff, 20 Nov 2026, §1.2). Paths are the app's own,
 * without the base path. Pure, so it is tested on its own. Null for pages
 * outside the funnel (legal pages, the panel, help).
 */

export type Stage = "landing" | "questionnaire" | "result" | "checkout";
export type FunnelPosition = { tier: "1" | "2" | "3"; stage: Stage };

const RULES: [RegExp, FunnelPosition][] = [
  [/^\/$/, { tier: "1", stage: "landing" }],
  [/^\/audit$/, { tier: "1", stage: "questionnaire" }],
  [/^\/audit\/(result|report\/[^/]+)$/, { tier: "1", stage: "result" }],
  [/^\/report$/, { tier: "2", stage: "landing" }],
  [/^\/report\/checkout$/, { tier: "2", stage: "checkout" }],
  [/^\/report\/my\/[^/]+\/questions(\/.*)?$/, { tier: "2", stage: "questionnaire" }],
  [/^\/report\/my\/[^/]+\/report(\/.*)?$/, { tier: "2", stage: "result" }],
];

export function funnelPosition(path: string): FunnelPosition | null {
  const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
  return RULES.find(([pattern]) => pattern.test(clean))?.[1] ?? null;
}
