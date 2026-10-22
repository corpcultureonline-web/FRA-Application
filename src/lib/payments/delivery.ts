import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { isValidEmail } from "@/lib/audit";
import { getDatabase } from "@/lib/db";
import { normaliseMobile } from "./signatures";

/**
 * Where the Report goes (Submitted v1.2 §3, §7): the email from the Audit
 * unless corrected on Screen 5, and the WhatsApp number from checkout. The
 * send reads these at send time, so a correction made while the Report is
 * with Ronak is the one used.
 */
export type Delivery = { email: string; mobile: string; reportSentAt: Date | null };

export async function delivery(orderId: number): Promise<Delivery | null> {
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    `SELECT COALESCE(o.delivery_email, a.email) AS email, o.mobile, o.report_sent_at
       FROM report_orders o JOIN audit_submissions a ON a.id = o.audit_submission_id
      WHERE o.id = ? LIMIT 1`,
    [orderId],
  );
  const row = rows[0];
  return row ? { email: row.email, mobile: row.mobile, reportSentAt: row.report_sent_at ?? null } : null;
}

export type DeliveryChange = { email: string } | { mobile: string };

/**
 * A correction from Screen 5. Refused once the Report has been sent: after
 * that the address has done its job, and changing it would only mislead.
 * Returns the stored value, or null when the input is not valid.
 */
export async function changeDelivery(orderId: number, change: DeliveryChange): Promise<string | null | "sent"> {
  const db = getDatabase();
  let column: "delivery_email" | "mobile";
  let value: string | null;
  if ("email" in change) {
    column = "delivery_email";
    value = isValidEmail(change.email) ? change.email.trim() : null;
  } else {
    column = "mobile";
    value = normaliseMobile(change.mobile);
  }
  if (!value || value.length > 320) return null;
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE report_orders SET ${column} = ? WHERE id = ? AND status = 'paid' AND report_sent_at IS NULL`,
    [value, orderId],
  );
  return result.affectedRows ? value : "sent";
}
