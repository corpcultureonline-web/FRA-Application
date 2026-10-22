import path from "node:path";

/**
 * Where the client's Tier 2 delivery sits on this machine, outside the repo
 * (corpculture). The tests compare the repo's copies against it; when a
 * new delivery arrives in a new folder, change these two lines. Set
 * TIER2_LIBRARY_DIR / TIER2_HANDOFF_DIR to point elsewhere without an edit.
 */
const CORPCULTURE = path.join(process.cwd(), "..", "..");
const TIER2 = path.join(CORPCULTURE, "tier2");

/** 22 October: the Tier 2 release (MANIFEST.md, Group I v1.17, Report v1.11, Strings v1.2). */
export const LIBRARY_DIR = process.env.TIER2_LIBRARY_DIR ?? path.join(TIER2, "fra-tier2-contentv.2");

/** Design package v3.0, canvas v67: 323 keys, 35 question codes. */
export const HANDOFF_DIR =
  process.env.TIER2_HANDOFF_DIR ?? path.join(TIER2, "fra-tier2-report-handoff-v3.0", "fra-tier2-report-handoff");
