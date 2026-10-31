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
import { recoveryEmail, type MailKind, type Recovery, type Stage } from "./email";

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
 * not recorded, so waiting is enough to be allowed again. The panel's resend
 * passes no IP: it is limited by contact only, sharing the public route's
 * window, so the two cannot send twice between them (Admin v1.4).
 */
export async function admitRequest(contact: Contact, ip: string | null): Promise<boolean> {
  const db = getDatabase();
  const contactHash = sha256(`${contact.kind}:${contact.value}`);
  const ipHash = sha256(`ip:${ip ?? "review-panel"}`);
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       SUM(contact_hash = ? AND created_at > NOW(3) - INTERVAL ${CONTACT_WINDOW_MINUTES} MINUTE) AS by_contact,
       SUM(ip_hash = ?) AS by_ip
       FROM result_link_requests
      WHERE (contact_hash = ? OR ip_hash = ?) AND created_at > NOW(3) - INTERVAL ${IP_WINDOW_MINUTES} MINUTE`,
    [contactHash, ipHash, contactHash, ipHash],
  );
  if (Number(rows[0]?.by_contact ?? 0) > 0 || (ip !== null && Number(rows[0]?.by_ip ?? 0) >= IP_LIMIT)) return false;
  await db.execute("INSERT INTO result_link_requests (contact_hash, ip_hash) VALUES (?, ?)", [contactHash, ipHash]);
  return true;
}

type Audit = { id: number; brand: string; founderName: string; email: string; createdAt: Date; reportToken: string };
type Paid = {
  stage: Exclude<Stage, "audit">;
  orderId: number;
  orderToken: string;
  paidAt: Date;
  deliveryEmail: string | null;
  audit: Audit;
};

const toAudit = (row: RowDataPacket): Audit => ({
  id: Number(row.audit_id),
  brand: row.brand_name,
  founderName: row.founder_name,
  email: row.email,
  createdAt: new Date(row.created_at),
  reportToken: row.report_token,
});

/** The contact's latest paid order, at its furthest point (§5), with the Audit it was bought from. */
async function latestPaid(contact: Contact): Promise<Paid | null> {
  const match = contact.kind === "email" ? "(a.email = ? OR o.delivery_email = ?)" : "(a.phone = ? OR o.mobile = ?)";
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT a.id AS audit_id, a.brand_name, a.founder_name, a.email, a.created_at, a.report_token,
            o.id AS order_id, o.token AS order_token, o.paid_at, o.delivery_email, o.submitted_at, o.report_sent_at
       FROM report_orders o
       JOIN audit_submissions a ON a.id = o.audit_submission_id
      WHERE ${match} AND o.status = 'paid' AND o.token IS NOT NULL AND a.report_token IS NOT NULL
      ORDER BY o.paid_at DESC
      LIMIT 1`,
    [contact.value, contact.value],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    stage: row.report_sent_at ? "report" : row.submitted_at ? "waiting" : "questions",
    orderId: Number(row.order_id),
    orderToken: row.order_token,
    paidAt: new Date(row.paid_at),
    deliveryEmail: row.delivery_email ?? null,
    audit: toAudit(row),
  };
}

/** The contact's most recent Audit, and whether it was itself bought from. */
async function latestAudit(contact: Contact): Promise<(Audit & { paid: boolean }) | null> {
  const match = contact.kind === "email" ? "a.email = ?" : "a.phone = ?";
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT a.id AS audit_id, a.brand_name, a.founder_name, a.email, a.created_at, a.report_token,
            EXISTS (SELECT 1 FROM report_orders o WHERE o.audit_submission_id = a.id AND o.status = 'paid') AS paid
       FROM audit_submissions a
      WHERE ${match} AND a.report_token IS NOT NULL
      ORDER BY a.created_at DESC
      LIMIT 1`,
    [contact.value],
  );
  return rows[0] ? { ...toAudit(rows[0]), paid: Boolean(rows[0].paid) } : null;
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
 * Sends the paid order's link to `send`. For an unfinished questionnaire that
 * is Screen 7, not /questions (§5): a fresh resume link, which replaces the
 * old one only once it has been sent.
 */
async function withPaidLink(paid: Paid, send: (url: string) => Promise<void>) {
  switch (paid.stage) {
    case "questions":
      await replaceResumeLink(paid.orderId, (token) => send(absolute(`/report/resume/${token}`)));
      return;
    case "waiting":
      return send(absolute(`/report/my/${paid.orderToken}`));
    case "report":
      return send(absolute(`/report/my/${paid.orderToken}/report`));
  }
}

/** What a send would do, decided before anything is sent: the panel's confirmation names it (Admin v1.4). */
export type RecoveryPlan = {
  kind: MailKind;
  brand: string;
  /** The address it goes to. */
  to: string;
  send: () => Promise<void>;
};

/**
 * The right link for a contact, or null when the contact is unknown.
 * Find-Result v1.1 §8:
 *
 * - no paid order: the most recent Audit;
 * - a paid order and no newer free Audit: the order's furthest point, so a
 *   paying founder is never handed back only his free result;
 * - a paid order and a newer free Audit (a deliberate retake): both, in one
 *   message, the newer first.
 *
 * A mobile entry is answered by email, to the address on the record, until
 * the WhatsApp channel (§7) is built: the link still reaches only its owner.
 */
export async function planRecovery(contact: Contact): Promise<RecoveryPlan | null> {
  const [paid, latest] = await Promise.all([latestPaid(contact), latestAudit(contact)]);
  const newer = latest && !latest.paid && (!paid || latest.createdAt > paid.audit.createdAt) ? latest : null;
  const typed = contact.kind === "email" ? contact.value : null;

  if (!paid) {
    if (!newer) return null;
    const to = typed ?? newer.email;
    return {
      kind: "audit",
      brand: newer.brand,
      to,
      send: () =>
        deliver({
          stage: "audit",
          to,
          founderName: newer.founderName,
          completedAt: newer.createdAt,
          url: absolute(`/audit/report/${newer.reportToken}`),
          secondUrl: tier2LinkFor(newer.reportToken),
        }),
    };
  }

  if (newer) {
    const to = typed ?? newer.email;
    return {
      kind: "both",
      brand: newer.brand,
      to,
      send: () =>
        withPaidLink(paid, (paidUrl) =>
          deliver({
            stage: "both",
            to,
            founderName: newer.founderName,
            completedAt: newer.createdAt,
            paidAt: paid.paidAt,
            url: absolute(`/audit/report/${newer.reportToken}`),
            secondUrl: paidUrl,
          }),
        ),
    };
  }

  const to = typed ?? paid.deliveryEmail ?? paid.audit.email;
  return {
    kind: paid.stage,
    brand: paid.audit.brand,
    to,
    send: () =>
      withPaidLink(paid, (url) =>
        deliver({ stage: paid.stage, to, founderName: paid.audit.founderName, completedAt: paid.audit.createdAt, url }),
      ),
  };
}

/**
 * Sends the right link, or does nothing when the contact is unknown. The
 * public route runs it after the response, so how long it takes says nothing
 * about whether the contact exists.
 */
export async function sendRecovery(contact: Contact) {
  await (await planRecovery(contact))?.send();
}
