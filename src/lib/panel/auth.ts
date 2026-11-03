import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { withBasePath } from "@/lib/base-path";
import { getDatabase } from "@/lib/db";
import { EmailUnavailable, sendEmail } from "@/lib/messages/email";
import { signInEmail } from "@/lib/messages/panel-email";
import { reportError } from "@/lib/monitoring/report-error";
import { SITE_ORIGIN } from "@/lib/seo";

/**
 * Review-panel sign-in (Admin library §8): an emailed link that works once and
 * lasts 15 minutes, then a long session cookie — 30 days for an approver, 7 for
 * the team login, which may be shared. No passwords anywhere. Only hashes of
 * the link and session tokens are stored.
 */

export type PanelUser = { id: number; email: string; name: string; role: "approver" | "team" };

export const SESSION_COOKIE = "fra_panel";
const LINK_MS = 15 * 60 * 1000;
const SESSION_DAYS = { approver: 30, team: 7 } as const;
/** One link a minute per address, so the form cannot flood an inbox. */
const RECENT_MS = 60_000;
const recent = new Map<string, number>();

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const isToken = (token: string) => /^[0-9a-f]{64}$/.test(token);

/** Where the panel is served. PANEL_ORIGIN for manage.corpculture.co; the app's origin until then. */
export function panelUrl(path: string) {
  return `${process.env.PANEL_ORIGIN ?? SITE_ORIGIN}${withBasePath(`/manage${path}`)}`;
}

/**
 * Sends a sign-in link if the address has access, and does nothing visible if
 * not: the page says the same either way (§8, T2A-LOGIN-SENT-SUB). Outside
 * production, with email not configured, the link is written to the server log.
 */
export async function requestSignIn(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const now = Date.now();
  if (!email || (recent.get(email) ?? 0) > now - RECENT_MS) return;
  recent.set(email, now);

  const db = getDatabase();
  const [users] = await db.query<RowDataPacket[]>("SELECT id FROM panel_users WHERE email = ?", [email]);
  if (!users[0]) return;
  const token = randomBytes(32).toString("hex");
  await db.execute("INSERT INTO panel_links (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [
    hash(token),
    users[0].id,
    new Date(now + LINK_MS),
  ]);
  const url = panelUrl(`/sign-in/${token}`);
  try {
    await sendEmail(signInEmail(email, url));
  } catch (error) {
    if (error instanceof EmailUnavailable && process.env.NODE_ENV !== "production") {
      console.warn(`Panel sign-in link for ${email} (email not configured): ${url}`);
      return;
    }
    reportError("Panel sign-in email failed", error);
  }
}

/** Whether a link can still be used, without using it — the page shows the expired state otherwise. */
export async function linkIsLive(token: string) {
  if (!isToken(token)) return false;
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    "SELECT 1 FROM panel_links WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP(3)",
    [hash(token)],
  );
  return rows.length > 0;
}

/**
 * Uses a link once and opens a session. Called from the sign-in button, not
 * on GET, so a mail scanner that prefetches the link cannot spend it.
 */
export async function consumeLink(token: string): Promise<boolean> {
  if (!isToken(token)) return false;
  const db = getDatabase();
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE panel_links SET used_at = CURRENT_TIMESTAMP(3)
      WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP(3)`,
    [hash(token)],
  );
  if (!result.affectedRows) return false;
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT u.id, u.role FROM panel_links l JOIN panel_users u ON u.id = l.user_id WHERE l.token_hash = ?",
    [hash(token)],
  );
  const user = rows[0];
  if (!user) return false;
  const session = randomBytes(32).toString("hex");
  const days = SESSION_DAYS[user.role as PanelUser["role"]];
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await db.execute("INSERT INTO panel_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [hash(session), user.id, expires]);
  (await cookies()).set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: withBasePath("/manage"),
    expires,
  });
  return true;
}

/** The signed-in reviewer, or null. Every panel page and action checks this. */
export async function panelUser(): Promise<PanelUser | null> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session || !isToken(session)) return null;
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT u.id, u.email, u.name, u.role FROM panel_sessions s JOIN panel_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.ended_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP(3)`,
    [hash(session)],
  );
  const row = rows[0];
  return row ? { id: row.id, email: row.email, name: row.name, role: row.role } : null;
}

export async function endSession() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (session && isToken(session)) {
    await getDatabase().execute("UPDATE panel_sessions SET ended_at = CURRENT_TIMESTAMP(3) WHERE token_hash = ?", [hash(session)]);
  }
  store.delete({ name: SESSION_COOKIE, path: withBasePath("/manage") });
}
