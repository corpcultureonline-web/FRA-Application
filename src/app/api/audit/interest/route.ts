import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isReportToken } from "@/lib/report";

/**
 * "Get my full report" on the result page: the founder wants an invite when
 * the paid Franchise Readiness Report opens. Identified by the report token
 * (the secret in their result link), or by id plus the matching email — so
 * knowing an id alone is not enough to flag someone else's row.
 */
export async function POST(request: Request) {
  let body: { token?: unknown; id?: unknown; email?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
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

  try {
    const [result] = await getDatabase().execute<ResultSetHeader>(
      `UPDATE audit_submissions
          SET report_interest_at = COALESCE(report_interest_at, CURRENT_TIMESTAMP)
        WHERE ${where}`,
      values,
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "We could not find your audit." }, { status: 404 });
    }
  } catch (error) {
    console.error("Report interest update failed", error);
    return NextResponse.json(
      { error: "Could not save your interest. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
