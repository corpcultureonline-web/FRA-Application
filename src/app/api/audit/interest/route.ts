import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

/**
 * "I'm interested" on the result page: the founder wants an invite when the
 * paid Franchise Readiness Report opens. The email must match the submission,
 * so knowing an id alone is not enough to flag someone else's row.
 */
export async function POST(request: Request) {
  let body: { id?: unknown; email?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || id <= 0 || typeof body.email !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const [result] = await getDatabase().execute<ResultSetHeader>(
      `UPDATE audit_submissions
          SET report_interest_at = COALESCE(report_interest_at, CURRENT_TIMESTAMP)
        WHERE id = ? AND email = ?`,
      [id, body.email.trim()],
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
