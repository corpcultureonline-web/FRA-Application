import "server-only";
import type { Pool, PoolConnection, ResultSetHeader } from "mysql2/promise";
import type { Profile } from "@/lib/audit";
import { getDatabase } from "@/lib/db";

type Executor = Pick<Pool | PoolConnection, "execute">;

/**
 * Section 1 of the Audit, stored the moment it is submitted so a founder who
 * stops before the result is still reachable (handoff v3.1 §5.1, migration
 * 016). One open row per browser session: editing Section 1 updates it, and
 * scoring the Audit closes it (linkLead), so a retake in the same session
 * starts a new row. `profile` has already passed profileProblems, with the
 * phone normalised to ten digits.
 */
export async function saveLead(sessionId: string, profile: Profile) {
  const db = getDatabase();
  const values = [
    profile.brandName,
    profile.founderName,
    profile.email,
    profile.phone,
    profile.category,
    profile.outlets,
    profile.city,
  ];
  const [updated] = await db.execute<ResultSetHeader>(
    `UPDATE audit_leads
        SET brand_name = ?, founder_name = ?, email = ?, phone = ?, category = ?, outlets = ?, city = ?
      WHERE session_id = ? AND submission_id IS NULL`,
    [...values, sessionId],
  );
  if (updated.affectedRows) return;
  await db.execute(
    `INSERT INTO audit_leads (brand_name, founder_name, email, phone, category, outlets, city, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [...values, sessionId],
  );
}

/** Closes the session's open lead against the Audit it became. */
export async function linkLead(db: Executor, sessionId: string, submissionId: number) {
  await db.execute("UPDATE audit_leads SET submission_id = ? WHERE session_id = ? AND submission_id IS NULL", [
    submissionId,
    sessionId,
  ]);
}
