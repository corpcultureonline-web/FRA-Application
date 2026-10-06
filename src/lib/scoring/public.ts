/**
 * The only shape of a Tier 1 score that may leave the server.
 *
 * Built field by field from an allow-list — never by spreading the engine
 * result — so the overall score, pillar scores and weights cannot leak into an
 * API response, page or email (spec §4, §6; decisions D1–D3, R3).
 */
import type { AreaStatus, GateOutcome, ScoreResult, ScoringConfig } from "./engine.ts";

export type PublicScore = {
  configVersion: string;
  range: { low: number; high: number };
  /** Band (after gates) whose verdict paragraph is shown. */
  band: { code: string; name: string };
  /** Bands spanned by the range, after gates, highest first. */
  levels: { code: string; name: string }[];
  gate: GateOutcome;
  gateReasons: ("dispute" | "noTrademark")[];
  /** In register order. Status only — no numbers. */
  areas: { code: string; name: string; status: AreaStatus | null }[];
  weakest: string | null;
  /** Pillar codes, largest gap first. */
  gapOrder: string[];
  /** Every band, highest first, for the readiness ladder. Names only. */
  ladder: { code: string; name: string }[];
};

export function toPublicScore(config: ScoringConfig, result: ScoreResult): PublicScore {
  const band = (code: string) => {
    const found = config.bands.find((b) => b.code === code)!;
    return { code: found.code, name: found.displayName };
  };

  return {
    configVersion: result.configVersion,
    range: { low: result.range.low, high: result.range.high },
    band: band(result.band),
    levels: result.levels.map(band),
    gate: result.gate,
    gateReasons: [...result.gateReasons],
    areas: result.pillars.map((pillar) => ({
      code: pillar.code,
      name: config.pillars.find((p) => p.code === pillar.code)!.displayName,
      status: pillar.status,
    })),
    weakest: result.weakest,
    gapOrder: [...result.gaps],
    ladder: [...config.bands].reverse().map((b) => band(b.code)),
  };
}
