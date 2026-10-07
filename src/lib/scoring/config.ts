import "server-only";
import type { RowDataPacket } from "mysql2";
import { getDatabase } from "@/lib/db";
import type { ScoringConfig } from "./engine";

/**
 * The active scoring config is seeded data in `fra_scoring_config` (decision
 * S8): changing a weight or option value is a data edit, not a deployment.
 * Cached briefly so an edit takes effect within a minute.
 */
const CACHE_MS = 60_000;
let cached: { config: ScoringConfig; loadedAt: number } | undefined;

function assertConfig(value: unknown): asserts value is ScoringConfig {
  const c = value as ScoringConfig;
  const ok =
    c &&
    typeof c.version === "string" &&
    typeof c.rangeHalfWidth === "string" &&
    Array.isArray(c.pillars) &&
    c.pillars.length > 0 &&
    Array.isArray(c.questions) &&
    Array.isArray(c.bands) &&
    c.bands.length > 0 &&
    c.status &&
    c.gates?.dispute &&
    c.gates?.noTrademark;
  if (!ok) throw new Error("fra_scoring_config: active config is malformed.");
}

export async function getScoringConfig(): Promise<ScoringConfig> {
  if (cached && Date.now() - cached.loadedAt < CACHE_MS) return cached.config;

  const [rows] = await getDatabase().query<RowDataPacket[]>(
    "SELECT config FROM fra_scoring_config WHERE tier = 1 AND active = 1 ORDER BY id DESC LIMIT 1",
  );
  if (!rows.length) {
    throw new Error("No active Tier 1 scoring config. Run `npm run seed:scoring`.");
  }
  const raw = rows[0].config;
  const config: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
  assertConfig(config);

  cached = { config, loadedAt: Date.now() };
  return config;
}

/**
 * A specific Tier 1 config version, active or not — used to rebuild a past
 * submission's result exactly as it was scored.
 */
export async function getScoringConfigVersion(version: string): Promise<ScoringConfig> {
  const active = await getScoringConfig().catch(() => undefined);
  if (active?.version === version) return active;

  const [rows] = await getDatabase().query<RowDataPacket[]>(
    "SELECT config FROM fra_scoring_config WHERE tier = 1 AND version = ? LIMIT 1",
    [version],
  );
  if (!rows.length) throw new Error(`Tier 1 scoring config ${version} not found.`);
  const raw = rows[0].config;
  const config: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
  assertConfig(config);
  return config;
}
