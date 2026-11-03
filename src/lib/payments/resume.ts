import "server-only";
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";

/**
 * Resume links (Resume v1.1, migration 010). One live link per order; a new
 * one supersedes the old. The draft behind it never expires (T32).
 */

/**
 * Replaces the order's resume link, but only once the new one has reached the
 * founder: `deliver` sends it, and the earlier links are retired only if that
 * succeeds. A failed send leaves his existing link working and discards the
 * new one, so a founder is never left holding nothing but expired links.
 */
export async function replaceResumeLink(orderId: number, deliver: (token: string) => Promise<void>): Promise<string> {
  const db = getDatabase();
  const token = randomBytes(16).toString("hex");
  await db.execute("INSERT INTO report_resume_links (token, order_id) VALUES (?, ?)", [token, orderId]);
  try {
    await deliver(token);
  } catch (error) {
    await db.execute("DELETE FROM report_resume_links WHERE token = ?", [token]).catch(() => {});
    throw error;
  }
  await db.execute(
    `UPDATE report_resume_links SET superseded_at = CURRENT_TIMESTAMP(3)
      WHERE order_id = ? AND superseded_at IS NULL AND token <> ?`,
    [orderId, token],
  );
  return token;
}

/**
 * The first link of a run, issued at payment (T32). It is kept even if the
 * email cannot be sent, so the run always has a link for Screen 7 to replace.
 */
export async function firstResumeLink(orderId: number): Promise<string> {
  const token = randomBytes(16).toString("hex");
  await getDatabase().execute("INSERT INTO report_resume_links (token, order_id) VALUES (?, ?)", [token, orderId]);
  return token;
}

export type ResumeLink = {
  orderId: number;
  /** The order's personal link token: where the questions and Screen 5 live. */
  personalToken: string;
  live: boolean;
  submitted: boolean;
  brandName: string;
};

/** A resume link, live or superseded, with its order. Null for a token we never issued. */
export async function resolveResumeLink(token: string): Promise<ResumeLink | null> {
  if (!/^[0-9a-f]{32}$/.test(token)) return null;
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT l.order_id, l.superseded_at, o.token AS personal_token, o.submitted_at, a.brand_name
       FROM report_resume_links l
       JOIN report_orders o ON o.id = l.order_id AND o.status = 'paid'
       JOIN audit_submissions a ON a.id = o.audit_submission_id
      WHERE l.token = ? LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row?.personal_token) return null;
  return {
    orderId: row.order_id,
    personalToken: row.personal_token,
    live: row.superseded_at === null,
    submitted: row.submitted_at !== null,
    brandName: row.brand_name,
  };
}
