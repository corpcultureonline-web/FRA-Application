import "server-only";
import type { RowDataPacket } from "mysql2";
import { getDatabase } from "@/lib/db";
import {
  findFraSubmissionId,
  getTier2InterestField,
  isZohoConfigured,
  updateFraSubmission,
  zohoDateTime,
} from "@/lib/zoho";

/** Optional mobile left on the "Get my full report" confirmation: 7–15 digits. */
export function readPhone(value: unknown): string | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "invalid";
  const phone = value.trim().replace(/\s+/g, " ");
  const digits = phone.replace(/\D/g, "").length;
  return /^\+?[\d\s()-]+$/.test(phone) && digits >= 7 && digits <= 15 ? phone : "invalid";
}

type InterestRow = RowDataPacket & {
  email: string;
  phone: string | null;
  zoho_record_id: string | null;
  report_interest_at: Date | null;
};

/**
 * Pushes a Tier 2 interest to the brand's Zoho record — "Tier 2 Interest At"
 * and the mobile, if given — so the Zoho workflow can notify the team
 * (Content Library §20). Fire-and-forget: the interest is already saved in
 * MySQL, so a failure here is logged, never shown to the founder.
 */
export async function pushTier2Interest(submissionId: number) {
  const field = getTier2InterestField();
  if (!field || !isZohoConfigured()) {
    if (!field) console.info("ZOHO_TIER2_FIELD not set, skipping the Zoho interest push.");
    return;
  }

  try {
    const db = getDatabase();
    const [rows] = await db.query<InterestRow[]>(
      "SELECT email, phone, zoho_record_id, report_interest_at FROM audit_submissions WHERE id = ?",
      [submissionId],
    );
    const row = rows[0];
    if (!row?.report_interest_at) return;

    let recordId = row.zoho_record_id ?? undefined;
    if (!recordId) {
      // Submissions saved before the record id was kept.
      recordId = await findFraSubmissionId(row.email);
      if (!recordId) {
        console.warn(`No Zoho FRA submission found for submission ${submissionId}; interest not pushed.`);
        return;
      }
      await db.execute("UPDATE audit_submissions SET zoho_record_id = ? WHERE id = ?", [recordId, submissionId]);
    }

    await updateFraSubmission(recordId, {
      [field]: zohoDateTime(new Date(row.report_interest_at)),
      ...(row.phone ? { Phone: row.phone } : {}),
    });
    console.info(`Zoho Tier 2 interest pushed (${recordId})`);
  } catch (error) {
    console.error(`Zoho Tier 2 interest push failed for submission ${submissionId}`, error);
  }
}
