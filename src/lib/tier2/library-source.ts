import path from "node:path";

/**
 * Where the client's Tier 2 delivery sits on this machine, outside the repo
 * (corpculture/tier2). The tests compare the repo's copies against it; when a
 * new delivery arrives in a new folder, change these two lines. Set
 * TIER2_LIBRARY_DIR / TIER2_HANDOFF_DIR to point elsewhere without an edit.
 */
const TIER2 = path.join(process.cwd(), "..", "..", "tier2");

export const LIBRARY_DIR =
  process.env.TIER2_LIBRARY_DIR ?? path.join(TIER2, "fra-tier2-contentv.1", "fra-tier2-content");

export const HANDOFF_DIR =
  process.env.TIER2_HANDOFF_DIR ?? path.join(TIER2, "fra-tier2-report-handoff-v2.3", "fra-tier2-report-handoff");
