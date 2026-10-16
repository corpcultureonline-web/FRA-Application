import "server-only";
import { randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";
import { isReportToken } from "@/lib/report";
import { GST_PERCENT, payable, TIERS } from "@/lib/pricing";
import { createRazorpayOrder } from "./razorpay";

/**
 * Report orders (report_orders, migration 007). An order is created when Pay
 * is tapped, and moves to paid or failed exactly once. Amounts come from the
 * pricing config, in paise; nothing about the price is taken from the browser.
 */

export type CheckoutAudit = {
  id: number;
  brandName: string;
  founderName: string;
  email: string;
  phone: string | null;
};

/** The completed Audit a purchase is made from (P11: the Report needs one). */
export async function auditForCheckout(auditToken: string): Promise<CheckoutAudit | null> {
  if (!isReportToken(auditToken)) return null;
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    "SELECT id, brand_name, founder_name, email, phone FROM audit_submissions WHERE report_token = ? LIMIT 1",
    [auditToken],
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, brandName: row.brand_name, founderName: row.founder_name, email: row.email, phone: row.phone };
}

/** The personal-link token of an order already paid for this Audit, so nobody is charged twice. */
export async function paidOrderToken(auditId: number): Promise<string | null> {
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    "SELECT token FROM report_orders WHERE audit_submission_id = ? AND status = 'paid' ORDER BY id LIMIT 1",
    [auditId],
  );
  return (rows[0]?.token as string | undefined) ?? null;
}

export type ConsentVersions = Record<"terms" | "privacy" | "refunds", string>;

export async function createOrder({
  auditId,
  mobile,
  consentVersions,
}: {
  auditId: number;
  mobile: string;
  consentVersions: ConsentVersions;
}) {
  const db = getDatabase();
  const basePaise = TIERS.report.base * 100;
  const amountPaise = payable("report") * 100;
  const [insert] = await db.execute<ResultSetHeader>(
    `INSERT INTO report_orders (audit_submission_id, base_paise, gst_percent, amount_paise, mobile, consent_at, consent_versions)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), ?)`,
    [auditId, basePaise, GST_PERCENT, amountPaise, mobile, JSON.stringify(consentVersions)],
  );
  const orderId = insert.insertId;
  const razorpayOrderId = await createRazorpayOrder({ amountPaise, receipt: `report-${orderId}`, orderId });
  await db.execute("UPDATE report_orders SET razorpay_order_id = ? WHERE id = ?", [razorpayOrderId, orderId]);
  return { orderId, razorpayOrderId, amountPaise };
}

export type PaidOrder = {
  orderId: number;
  auditId: number;
  token: string;
  amountPaise: number;
  directLink: boolean;
  /** False when the order was already paid — a retried webhook or a second confirm. */
  newlyPaid: boolean;
};

/**
 * Marks the order paid, once. Both the browser's confirm and Razorpay's
 * webhook call this; whichever arrives second finds it paid and changes
 * nothing, so the grant is idempotent on the payment (T7).
 */
export async function markPaid(razorpayOrderId: string, razorpayPaymentId: string): Promise<PaidOrder | null> {
  const db = await getDatabase().getConnection();
  try {
    await db.beginTransaction();
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, audit_submission_id, status, token, amount_paise, direct_link
         FROM report_orders WHERE razorpay_order_id = ? FOR UPDATE`,
      [razorpayOrderId],
    );
    const row = rows[0];
    if (!row) {
      await db.rollback();
      return null;
    }
    const base = {
      orderId: row.id as number,
      auditId: row.audit_submission_id as number,
      amountPaise: row.amount_paise as number,
      directLink: Boolean(row.direct_link),
    };
    if (row.status === "paid") {
      await db.commit();
      return { ...base, token: row.token, newlyPaid: false };
    }
    const token = randomBytes(16).toString("hex");
    await db.execute(
      `UPDATE report_orders
          SET status = 'paid', razorpay_payment_id = ?, token = ?, paid_at = CURRENT_TIMESTAMP(3),
              failure_reason = NULL, failed_at = NULL
        WHERE id = ?`,
      [razorpayPaymentId, token, row.id],
    );
    await db.commit();
    return { ...base, token, newlyPaid: true };
  } catch (error) {
    await db.rollback().catch(() => {});
    throw error;
  } finally {
    db.release();
  }
}

/**
 * Marks an unpaid order failed. A paid order is never moved back: a late
 * failure notice for an earlier attempt must not undo a later success.
 * Returns the order id when the row changed, so the event is logged once.
 */
export async function markFailed(razorpayOrderId: string, reason: string): Promise<number | null> {
  const db = getDatabase();
  const [rows] = await db.query<RowDataPacket[]>("SELECT id FROM report_orders WHERE razorpay_order_id = ? LIMIT 1", [
    razorpayOrderId,
  ]);
  const orderId = rows[0]?.id as number | undefined;
  if (!orderId) return null;
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE report_orders SET status = 'failed', failure_reason = ?, failed_at = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND status = 'created'`,
    [reason.slice(0, 64), orderId],
  );
  return result.affectedRows ? orderId : null;
}
