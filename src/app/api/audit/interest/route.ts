import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { after, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { reportError } from "@/lib/monitoring/report-error";
import { isReportToken } from "@/lib/report";
import { pushTier2Interest, readPhone } from "@/lib/tier2-interest";

/**
 * "Get my full report" on the result page: the founder wants the paid
 * Franchise Readiness Report. Identified by the report token (the secret in
 * their result link), or by id plus the matching email — so knowing an id
 * alone is not enough to flag someone else's row.
 *
 * Called once on the click, and again if they leave the optional mobile
 * number. The interest is saved first; the Zoho push runs after the response,
 * so a slow or failing CRM never costs the founder their confirmation.
 */
export async function POST(request: Request) {
  let body: { token?: unknown; id?: unknown; email?: unknown; phone?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const phone = readPhone(body.phone);
  if (phone === "invalid") {
    return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
  }

  let where: string;
  let values: (string | number)[];
  if (typeof body.token === "string" && isReportToken(body.token)) {
    where = "report_token = ?";
    values = [body.token];
  } else {
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0 || typeof body.email !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    where = "id = ? AND email = ?";
    values = [id, body.email.trim()];
  }

  let submissionId: number;
  try {
    const db = getDatabase();
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE audit_submissions
          SET report_interest_at = COALESCE(report_interest_at, CURRENT_TIMESTAMP)
              ${phone ? ", phone = ?" : ""}
        WHERE ${where}`,
      phone ? [phone, ...values] : values,
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "We could not find your audit." }, { status: 404 });
    }
    const [rows] = await db.query<RowDataPacket[]>(`SELECT id FROM audit_submissions WHERE ${where}`, values);
    submissionId = rows[0].id as number;
  } catch (error) {
    reportError("Report interest update failed", error);
    return NextResponse.json(
      { error: "Could not save your interest. Please try again later." },
      { status: 500 },
    );
  }

  after(() => pushTier2Interest(submissionId));
  return NextResponse.json({ success: true });
}
