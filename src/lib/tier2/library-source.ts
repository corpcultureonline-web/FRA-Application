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
 * 1 November: the developer package answering the developer's 1 November list
 * (fra-content-nov-2; T178, T179). Everything the 30 October re-issue
 * (fra-content-new) carried is here unchanged, plus Admin v1.5, Checkout v1.2,
 * Field Help v1.4, Submitted v1.3 and Privacy v1.7. Its libraries are taken one
 * at a time as each item lands, so a file listed here is checked against this
 * delivery and every other file still against LIBRARY_DIR.
 */
export const LIBRARY_DIR_LATEST = process.env.TIER2_LIBRARY_DIR_LATEST ?? path.join(TIER2, "fra-content-nov-2");
const FROM_LATEST = new Set([
  "Content-Library-Group-E.md",
  "Content-Library-Tier2-Admin.md",
  "Content-Library-Tier2-Checkout.md",
  "Content-Library-Tier2-Field-Help.md",
  "Content-Library-Tier2-Submitted.md",
  "Privacy-Policy.md",
  "Terms-and-Conditions.md",
]);

/** The client's copy of a library file, from whichever delivery it was taken. */
export const librarySource = (file: string) => path.join(FROM_LATEST.has(file) ? LIBRARY_DIR_LATEST : LIBRARY_DIR, file);

/** Design package v3.0, canvas v67: 323 keys, 35 question codes. */
export const HANDOFF_DIR =
  process.env.TIER2_HANDOFF_DIR ?? path.join(TIER2, "fra-tier2-report-handoff-v3.0", "fra-tier2-report-handoff");
