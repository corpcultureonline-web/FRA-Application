import "server-only";
import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { withBasePath } from "@/lib/base-path";
import { getDatabase } from "@/lib/db";
import { EmailUnavailable, sendEmail } from "@/lib/messages/email";
import { SITE_ORIGIN } from "@/lib/seo";
import type { Contact } from "./contact";
import { recoveryEmail, type Recovery } from "./email";

/**
 * /find-my-result (handoff v3.1 §6, Find-Result library §8). Three rules:
 * the link is never in the response; the response is the same whether or not
 * the contact exists; and requests are rate-limited by contact and by IP.
 *
 * The Audit result only: where the Report is on sale, the paid states
 * (questions, waiting, report) are added with it.
 */

/** One request per contact in this window; T1F-RESEND-WAIT says "a few minutes". */
const CONTACT_WINDOW_MINUTES = 5;
/** Per IP, so one person cannot walk a list of addresses. */
const IP_LIMIT = 10;
const IP_WINDOW_MINUTES = 60;

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/**
 * Records the request and says whether it may go ahead. A refused request is
 * not recorded, so waiting is enough to be allowed again.
 */
export async function admitRequest(contact: Contact, ip: string): Promise<boolean> {
  const db = getDatabase();
  const contactHash = sha256(`${contact.kind}:${contact.value}`);
  const ipHash = sha256(`ip:${ip}`);
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       SUM(contact_hash = ? AND created_at > NOW(3) - INTERVAL ${CONTACT_WINDOW_MINUTES} MINUTE) AS by_contact,
       SUM(ip_hash = ?) AS by_ip
       FROM result_link_requests
      WHERE (contact_hash = ? OR ip_hash = ?) AND created_at > NOW(3) - INTERVAL ${IP_WINDOW_MINUTES} MINUTE`,
    [contactHash, ipHash, contactHash, ipHash],
  );
  if (Number(rows[0]?.by_contact ?? 0) > 0 || Number(rows[0]?.by_ip ?? 0) >= IP_LIMIT) return false;
  await db.execute("INSERT INTO result_link_requests (contact_hash, ip_hash) VALUES (?, ?)", [contactHash, ipHash]);
  return true;
}

/** The contact's most recent Audit (§8: several audits resolve to the latest). */
async function latestAudit(contact: Contact) {
  const match = contact.kind === "email" ? "email = ?" : "phone = ?";
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT founder_name, email, created_at, report_token
       FROM audit_submissions
      WHERE ${match} AND report_token IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [contact.value],
  );
  return rows[0] ?? null;
}

const absolute = (path: string) => `${SITE_ORIGIN}${withBasePath(path)}`;

async function deliver(recovery: Recovery) {
  try {
    await sendEmail(recoveryEmail(recovery));
  } catch (error) {
    // Local development without ZeptoMail: the link goes to the server log, as the panel's sign-in does.
    if (error instanceof EmailUnavailable && process.env.NODE_ENV !== "production") {
      console.info(`[find-my-result] email not configured; ${recovery.stage} link for ${recovery.to}: ${recovery.url}`);
      return;
    }
    throw error;
  }
}

/**
 * Sends the result link, or does nothing when the contact is unknown. Runs
 * after the response, so how long it takes says nothing about whether the
 * contact exists.
 *
 * A mobile entry is answered by email, to the address on the Audit, until
 * the WhatsApp channel (§7) is built: the link still reaches only its owner.
 */
export async function sendRecovery(contact: Contact) {
  const audit = await latestAudit(contact);
  if (!audit) return;
  await deliver({
    stage: "audit",
    to: contact.kind === "email" ? contact.value : audit.email,
    founderName: audit.founder_name,
    completedAt: new Date(audit.created_at),
    url: absolute(`/audit/report/${audit.report_token}`),
  });
}
