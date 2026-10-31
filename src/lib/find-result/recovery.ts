import "server-only";
import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { withBasePath } from "@/lib/base-path";
import { getDatabase } from "@/lib/db";
import { EmailUnavailable, sendEmail } from "@/lib/messages/email";
import { replaceResumeLink } from "@/lib/payments/resume";
import { tier2LinkFor } from "@/lib/report";
import { SITE_ORIGIN } from "@/lib/seo";
import type { Contact } from "./contact";
import { recoveryEmail, type Recovery, type Stage } from "./email";

/**
 * /find-my-result (handoff v3.1 §6, Find-Result library §8). Three rules:
 * the link is never in the response; the response is the same whether or not
 * the contact exists; and requests are rate-limited by contact and by IP.
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

type Furthest = {
  stage: Stage;
  founderName: string;
  auditEmail: string;
  completedAt: Date;
  reportToken: string;
  orderId: number | null;
  orderToken: string | null;
  deliveryEmail: string | null;
};

/**
 * The furthest point this contact reached (§6.1): a paid Report before a free
 * result, so a founder who paid and later retook the Audit is never handed
 * back only the free one; then the most recent.
 */
async function furthest(contact: Contact): Promise<Furthest | null> {
  const match = contact.kind === "email" ? "(a.email = ? OR o.delivery_email = ?)" : "(a.phone = ? OR o.mobile = ?)";
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT a.founder_name, a.email, a.created_at, a.report_token,
            o.id AS order_id, o.token AS order_token, o.delivery_email, o.submitted_at, o.report_sent_at
       FROM audit_submissions a
       LEFT JOIN report_orders o ON o.audit_submission_id = a.id AND o.status = 'paid'
      WHERE ${match} AND a.report_token IS NOT NULL
      ORDER BY o.id IS NOT NULL DESC, COALESCE(o.paid_at, a.created_at) DESC
      LIMIT 1`,
    [contact.value, contact.value],
  );
  const row = rows[0];
  if (!row) return null;
  const paid = row.order_id != null && row.order_token;
  const stage: Stage = !paid ? "audit" : row.report_sent_at ? "report" : row.submitted_at ? "waiting" : "questions";
  return {
    stage,
    founderName: row.founder_name,
    auditEmail: row.email,
    completedAt: new Date(row.created_at),
    reportToken: row.report_token,
    orderId: paid ? Number(row.order_id) : null,
    orderToken: paid ? row.order_token : null,
    deliveryEmail: row.delivery_email ?? null,
  };
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
 * Sends the link for the furthest point reached, or does nothing when the
 * contact is unknown. Runs after the response, so how long it takes says
 * nothing about whether the contact exists.
 *
 * A mobile entry is answered by email, to the address on the record, until
 * the WhatsApp channel (§7) is built: the link still reaches only its owner.
 */
export async function sendRecovery(contact: Contact) {
  const found = await furthest(contact);
  if (!found) return;
  const to =
    contact.kind === "email"
      ? contact.value
      : found.stage === "audit"
        ? found.auditEmail
        : (found.deliveryEmail ?? found.auditEmail);
  const base = { stage: found.stage, to, founderName: found.founderName, completedAt: found.completedAt };

  switch (found.stage) {
    case "audit":
      return deliver({
        ...base,
        url: absolute(`/audit/report/${found.reportToken}`),
        secondUrl: tier2LinkFor(found.reportToken),
      });
    case "questions":
      // Screen 7, not /questions (§5). A fresh resume link replaces the old one only once it is sent.
      await replaceResumeLink(found.orderId!, (token) => deliver({ ...base, url: absolute(`/report/resume/${token}`) }));
      return;
    case "waiting":
      return deliver({ ...base, url: absolute(`/report/my/${found.orderToken}`) });
    case "report":
      return deliver({ ...base, url: absolute(`/report/my/${found.orderToken}/report`) });
  }
}
