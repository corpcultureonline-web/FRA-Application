import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { withBasePath } from "@/lib/base-path";
import { getDatabase } from "@/lib/db";
import { logOrderEvent, type EventContext } from "@/lib/events/server";
import { EmailUnavailable, sendEmail } from "@/lib/messages/email";
import { refundEmail, reportReadyEmail } from "@/lib/messages/panel-email";
import { reportError } from "@/lib/monitoring/report-error";
import { delivery } from "@/lib/payments/delivery";
import { refundPayment } from "@/lib/payments/razorpay";
import type { ReportDocument } from "@/lib/report/assemble";
import type { Paragraphs } from "@/lib/report/content";
import { applyEdits, pieces } from "@/lib/report/pieces";
import { SITE_ORIGIN } from "@/lib/seo";
import type { PanelUser } from "./auth";

/**
 * The review panel's reads and writes (Admin library v1.3). Every write
 * checks the reviewer's role itself — a Server Action is reachable by a
 * direct POST, so the hidden button is not the permission (§6).
 */

export type ReviewStatus = "waiting" | "approved" | "returned" | "refunded";
export type Filter = ReviewStatus | "all";

const STATUS_SQL = `CASE WHEN o.refunded_at IS NOT NULL THEN 'refunded'
  WHEN d.approved_at IS NOT NULL THEN 'approved'
  WHEN d.returned_at IS NOT NULL THEN 'returned' ELSE 'waiting' END`;

const json = <T>(raw: unknown) => (raw === null || raw === undefined ? null : ((typeof raw === "string" ? JSON.parse(raw) : raw) as T));
const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

export type QueueRow = {
  orderId: number;
  brand: string;
  submittedAt: Date;
  /** Hours since submission; frozen at approval (§2: the clock stops). */
  hours: number;
  overall: string;
  band: string;
  status: ReviewStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
};

/** Screen 8: oldest first, because the oldest is the one about to breach (§2). */
export async function queue(filter: Filter): Promise<{ rows: QueueRow[]; counts: Record<Filter, number> }> {
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT o.id, a.brand_name, o.submitted_at, d.overall_score, d.band, d.approved_at, u.name AS approved_by,
            ${STATUS_SQL} AS status
       FROM report_orders o
       JOIN report_documents d ON d.order_id = o.id
       JOIN audit_submissions a ON a.id = o.audit_submission_id
       LEFT JOIN panel_users u ON u.id = d.approved_by
      WHERE o.status = 'paid' AND o.submitted_at IS NOT NULL
      ORDER BY o.submitted_at ASC`,
  );
  const now = Date.now();
  const all: QueueRow[] = rows.map((row) => {
    const submitted = new Date(row.submitted_at);
    const end = row.approved_at ? new Date(row.approved_at).getTime() : now;
    return {
      orderId: Number(row.id),
      brand: row.brand_name,
      submittedAt: submitted,
      hours: Math.max(0, Math.floor((end - submitted.getTime()) / 3_600_000)),
      overall: Number(row.overall_score).toFixed(1),
      band: row.band,
      status: row.status,
      approvedBy: row.approved_by ?? null,
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    };
  });
  const counts = { waiting: 0, approved: 0, returned: 0, refunded: 0, all: all.length } as Record<Filter, number>;
  for (const row of all) counts[row.status] += 1;
  return { rows: filter === "all" ? all : all.filter((row) => row.status === filter), counts };
}

export type Edit = { slot: string; pieceId: string; original: Paragraphs; edited: Paragraphs; by: string; at: Date };

/** The edit standing on each slot: the latest row, unless that row restored the library version. */
async function currentEdits(orderId: number): Promise<Map<string, Edit>> {
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT e.slot, e.piece_id, e.original, e.edited, e.created_at, u.name
       FROM report_edits e JOIN panel_users u ON u.id = e.user_id
      WHERE e.order_id = ? ORDER BY e.id ASC`,
    [orderId],
  );
  const edits = new Map<string, Edit>();
  for (const row of rows) {
    const edited = json<Paragraphs>(row.edited);
    if (!edited) edits.delete(row.slot);
    else
      edits.set(row.slot, {
        slot: row.slot,
        pieceId: row.piece_id,
        original: json<Paragraphs>(row.original) ?? [],
        edited,
        by: row.name,
        at: new Date(row.created_at),
      });
  }
  return edits;
}

export type ReviewDetail = {
  orderId: number;
  token: string;
  status: ReviewStatus;
  submittedAt: Date;
  hours: number;
  generated: ReportDocument;
  /** What the founder will receive, or received: the generated Report with edits applied. */
  shown: ReportDocument;
  edits: Map<string, Edit>;
  brand: { name: string; category: string; outlets: string; city: string; rangeLow: number; rangeHigh: number };
  /** Read live, never cached at submission (§3, T2A-APPROVE-CONFIRM). */
  email: string;
  mobile: string;
  amountPaise: number;
  amount: string;
  approved: { by: string; at: Date } | null;
  returned: { by: string; at: Date; note: string } | null;
  refunded: { by: string; at: Date } | null;
  /** Pairs the founder was warned about and kept (contradiction_warned, "proceeded"). */
  confirmedPairs: string[];
};

export async function reviewDetail(orderId: number): Promise<ReviewDetail | null> {
  const db = getDatabase();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT o.id, o.token, o.submitted_at, o.amount_paise, o.refunded_at, d.content, d.approved_content,
            d.approved_at, d.returned_at, d.return_note, ${STATUS_SQL} AS status,
            a.brand_name, a.category, a.outlets, a.city, a.range_low, a.range_high,
            ua.name AS approved_by, ur.name AS returned_by, uf.name AS refunded_by
       FROM report_orders o
       JOIN report_documents d ON d.order_id = o.id
       JOIN audit_submissions a ON a.id = o.audit_submission_id
       LEFT JOIN panel_users ua ON ua.id = d.approved_by
       LEFT JOIN panel_users ur ON ur.id = d.returned_by
       LEFT JOIN panel_users uf ON uf.id = o.refunded_by
      WHERE o.id = ? AND o.status = 'paid' AND o.submitted_at IS NOT NULL`,
    [orderId],
  );
  const row = rows[0];
  if (!row) return null;
  const [where, edits, [pairs]] = await Promise.all([
    delivery(orderId),
    currentEdits(orderId),
    db.query<RowDataPacket[]>("SELECT pair_code FROM report_contradictions WHERE order_id = ? AND outcome = 'proceeded'", [orderId]),
  ]);
  const generated = json<ReportDocument>(row.content)!;
  const approvedContent = json<ReportDocument>(row.approved_content);
  const submitted = new Date(row.submitted_at);
  const end = row.approved_at ? new Date(row.approved_at).getTime() : Date.now();
  return {
    orderId,
    token: row.token,
    status: row.status,
    submittedAt: submitted,
    hours: Math.max(0, Math.floor((end - submitted.getTime()) / 3_600_000)),
    generated,
    shown: approvedContent ?? applyEdits(generated, new Map([...edits].map(([slot, edit]) => [slot, edit.edited]))),
    edits,
    brand: {
      name: row.brand_name,
      category: row.category,
      outlets: row.outlets,
      city: row.city,
      rangeLow: Number(row.range_low),
      rangeHigh: Number(row.range_high),
    },
    email: where?.email ?? "",
    mobile: where?.mobile ?? "",
    amountPaise: Number(row.amount_paise),
    amount: rupees(Number(row.amount_paise)),
    approved: row.approved_at ? { by: row.approved_by, at: new Date(row.approved_at) } : null,
    returned: row.returned_at ? { by: row.returned_by, at: new Date(row.returned_at), note: row.return_note ?? "" } : null,
    refunded: row.refunded_at ? { by: row.refunded_by, at: new Date(row.refunded_at) } : null,
    confirmedPairs: pairs.map((p) => p.pair_code as string),
  };
}

export class PanelError extends Error {}

function approverOnly(user: PanelUser) {
  if (user.role !== "approver") throw new PanelError("Approvers only.");
}

/** §3: an edit is a row with the library's text beside the reviewer's; never an overwrite. */
export async function saveEdit(user: PanelUser, orderId: number, slot: string, text: string | null) {
  approverOnly(user);
  const detail = await reviewDetail(orderId);
  if (!detail || detail.status !== "waiting") throw new PanelError("This Report is no longer open for editing.");
  const piece = pieces(detail.generated).find((p) => p.slot === slot);
  if (!piece) throw new PanelError("That block is not in this Report.");
  const edited =
    text === null
      ? null
      : text
          .replace(/\r\n/g, "\n")
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
  // Saving the library's own words, or nothing at all, is a restore.
  const restore = !edited?.length || JSON.stringify(edited) === JSON.stringify(piece.paragraphs);
  if (restore && !detail.edits.has(slot)) return;
  await getDatabase().execute(
    "INSERT INTO report_edits (order_id, slot, piece_id, original, edited, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    [orderId, slot, piece.pieceId, JSON.stringify(piece.paragraphs), restore ? null : JSON.stringify(edited), user.id],
  );
}

const reportUrl = (token: string) => `${SITE_ORIGIN}${withBasePath(`/report/my/${token}/report`)}?ch=email`;

/**
 * Approve and send (§3): freezes the Report with its edits, sends it to the
 * address on the order as it stands now, and stops the clock. If the email
 * cannot go, the approval is undone and the reviewer is told — the queue never
 * says "sent" for a Report nobody received. WhatsApp joins when its template is
 * approved (Messages §12).
 */
export async function approve(user: PanelUser, context: EventContext, orderId: number) {
  approverOnly(user);
  const detail = await reviewDetail(orderId);
  if (!detail || detail.status !== "waiting") throw new PanelError("This Report is not awaiting review.");
  if (!detail.email) throw new PanelError("There is no email address on this order.");
  const db = getDatabase();
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE report_documents d JOIN report_orders o ON o.id = d.order_id
        SET d.approved_content = ?, d.approved_at = CURRENT_TIMESTAMP(3), d.approved_by = ?
      WHERE d.order_id = ? AND d.approved_at IS NULL AND d.returned_at IS NULL AND o.refunded_at IS NULL`,
    [JSON.stringify(detail.shown), user.id, orderId],
  );
  if (!result.affectedRows) throw new PanelError("Someone else has just acted on this Report.");

  const channels: string[] = [];
  try {
    await sendEmail(reportReadyEmail(detail.email, reportUrl(detail.token)));
    channels.push("email");
  } catch (error) {
    if (!(error instanceof EmailUnavailable && process.env.NODE_ENV !== "production")) {
      await db.execute(
        "UPDATE report_documents SET approved_content = NULL, approved_at = NULL, approved_by = NULL WHERE order_id = ?",
        [orderId],
      );
      reportError("Report-ready email failed", error, { order_id: orderId });
      throw new PanelError("The Report could not be sent, so it has not been approved. Try again in a few minutes.");
    }
    console.warn(`Report ${orderId} approved without sending: email is not configured (development only).`);
  }
  await db.execute("UPDATE report_orders SET report_sent_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND report_sent_at IS NULL", [orderId]);
  await logOrderEvent(
    context,
    "report_approved",
    { order_id: orderId, by: user.email, pieces_edited: detail.edits.size, ms_in_review: Date.now() - detail.submittedAt.getTime() },
    orderId,
  );
  await logOrderEvent(context, "report_sent", { order_id: orderId, channels }, orderId);
}

/** Return (§1): stops the Report with a note. It leaves the queue; a person takes it from there. */
export async function returnReport(user: PanelUser, context: EventContext, orderId: number, note: string) {
  approverOnly(user);
  const text = note.trim();
  if (!text) throw new PanelError("Say what is wrong with it.");
  const [result] = await getDatabase().execute<ResultSetHeader>(
    `UPDATE report_documents d JOIN report_orders o ON o.id = d.order_id
        SET d.returned_at = CURRENT_TIMESTAMP(3), d.returned_by = ?, d.return_note = ?
      WHERE d.order_id = ? AND d.approved_at IS NULL AND d.returned_at IS NULL AND o.refunded_at IS NULL`,
    [user.id, text, orderId],
  );
  if (!result.affectedRows) throw new PanelError("This Report is not awaiting review.");
  await logOrderEvent(context, "report_returned", { order_id: orderId, by: user.email, note_len: text.length }, orderId);
}

/**
 * Refund (§5): on any order, at any status, after approval too (P15). The
 * money moves first; the record follows only once Razorpay has accepted it.
 */
export async function refund(user: PanelUser, context: EventContext, orderId: number) {
  approverOnly(user);
  const db = getDatabase();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT o.razorpay_payment_id, o.amount_paise, o.refunded_at, o.report_sent_at, o.submitted_at
       FROM report_orders o WHERE o.id = ? AND o.status = 'paid'`,
    [orderId],
  );
  const order = rows[0];
  if (!order?.razorpay_payment_id) throw new PanelError("There is no payment on this order to refund.");
  if (order.refunded_at) throw new PanelError("This order has already been refunded.");
  const amountPaise = Number(order.amount_paise);
  const refundId = await refundPayment({ paymentId: order.razorpay_payment_id, amountPaise, orderId });
  await db.execute(
    `UPDATE report_orders SET refunded_at = CURRENT_TIMESTAMP(3), refunded_by = ?, refund_paise = ?, refund_id = ?
      WHERE id = ? AND refunded_at IS NULL`,
    [user.id, amountPaise, refundId, orderId],
  );
  // Where the order stood when the money went back: the refund boundary is submission (T72), with the T73 exception after delivery.
  const reason = order.report_sent_at ? "after_delivery" : order.submitted_at ? "awaiting_review" : "before_submission";
  await logOrderEvent(context, "refund_issued", { order_id: orderId, amount_paise: amountPaise, by: user.email, reason }, orderId);
  const where = await delivery(orderId);
  if (where?.email) {
    await sendEmail(refundEmail(where.email, rupees(amountPaise))).catch((error) => {
      if (!(error instanceof EmailUnavailable)) reportError("Refund email failed", error, { order_id: orderId });
    });
  }
}

export type RateRow = { pieceId: string; appeared: number; edited: number; rate: number; lastAt: Date | null; lastBy: string | null; flag: boolean };

/**
 * §4, which blocks keep getting rewritten: appearances counted from every
 * generated Report, edits from the edits standing in each. Flagged at a third
 * or more, once a piece has appeared three times.
 */
export async function editRates(): Promise<RateRow[]> {
  const db = getDatabase();
  const [[docs], [edits]] = await Promise.all([
    db.query<RowDataPacket[]>("SELECT order_id, content FROM report_documents"),
    db.query<RowDataPacket[]>(
      `SELECT e.order_id, e.slot, e.piece_id, e.edited, e.created_at, u.name
         FROM report_edits e JOIN panel_users u ON u.id = e.user_id ORDER BY e.id ASC`,
    ),
  ]);
  const appeared = new Map<string, number>();
  for (const doc of docs) {
    for (const piece of pieces(json<ReportDocument>(doc.content)!)) appeared.set(piece.pieceId, (appeared.get(piece.pieceId) ?? 0) + 1);
  }
  const standing = new Map<string, { pieceId: string; edited: boolean }>();
  const last = new Map<string, { at: Date; by: string }>();
  for (const edit of edits) {
    standing.set(`${edit.order_id}:${edit.slot}`, { pieceId: edit.piece_id, edited: edit.edited !== null });
    if (edit.edited !== null) last.set(edit.piece_id, { at: new Date(edit.created_at), by: edit.name });
  }
  const editedIn = new Map<string, number>();
  for (const { pieceId, edited } of standing.values()) if (edited) editedIn.set(pieceId, (editedIn.get(pieceId) ?? 0) + 1);
  return [...appeared]
    .map(([pieceId, count]) => {
      const edited = editedIn.get(pieceId) ?? 0;
      const rate = count ? edited / count : 0;
      return { pieceId, appeared: count, edited, rate, lastAt: last.get(pieceId)?.at ?? null, lastBy: last.get(pieceId)?.by ?? null, flag: count >= 3 && rate >= 1 / 3 };
    })
    .filter((row) => row.edited > 0)
    .sort((a, b) => b.rate - a.rate || b.edited - a.edited);
}
