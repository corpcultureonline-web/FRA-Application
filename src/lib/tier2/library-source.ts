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

/**
 * 30 October: the developer package (Handoff v3.1), re-issued that afternoon
 * as fra-content-new (Admin v1.4, Privacy v1.6, Tier 1 Questionnaire v1.1,
 * Find-Result v1.1). Its libraries are taken one at a time as each item lands,
 * so a file listed here is checked against this delivery and every other file
 * still against LIBRARY_DIR.
 */
export const LIBRARY_DIR_30OCT = process.env.TIER2_LIBRARY_DIR_30OCT ?? path.join(TIER2, "fra-content-new");
const FROM_30OCT = new Set([
  "Content-Library-Group-E.md",
  "Content-Library-Tier2-Admin.md",
  "Privacy-Policy.md",
  "Terms-and-Conditions.md",
]);

/** The client's copy of a library file, from whichever delivery it was taken. */
export const librarySource = (file: string) => path.join(FROM_30OCT.has(file) ? LIBRARY_DIR_30OCT : LIBRARY_DIR, file);

/** Design package v3.0, canvas v67: 323 keys, 35 question codes. */
export const HANDOFF_DIR =
  process.env.TIER2_HANDOFF_DIR ?? path.join(TIER2, "fra-tier2-report-handoff-v3.0", "fra-tier2-report-handoff");
