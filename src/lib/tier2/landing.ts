import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";
import { isReportToken } from "@/lib/report";
import { parseLandingProse, type LandingProse } from "./landing-prose";

let cachedProse: LandingProse | undefined;

/** The Landing library's lines that sit in prose rather than key tables (FAQ, the fixed opening, the boundary). */
export function landingProse(): LandingProse {
  return (cachedProse ??= parseLandingProse(
    readFileSync(path.join(process.cwd(), "src", "content", "tier2", "Content-Library-Tier2-Landing.md"), "utf8"),
  ));
}

/**
 * Screen 1's two states, one URL (HANDOFF §5): a visitor arriving with his
 * Audit's result token (?audit=…) is "known" and sees his own range; anyone
 * else is "cold" and is sent to the free Audit first. Decided from the Audit
 * record, never from a switch the visitor can flip.
 */
export type KnownVisitor = { token: string; low: number; high: number };

export async function knownVisitor(token: string | undefined): Promise<KnownVisitor | null> {
  if (!token || !isReportToken(token)) return null;
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    "SELECT range_low, range_high FROM audit_submissions WHERE report_token = ? LIMIT 1",
    [token],
  );
  const row = rows[0];
  return row ? { token, low: Number(row.range_low), high: Number(row.range_high) } : null;
}
