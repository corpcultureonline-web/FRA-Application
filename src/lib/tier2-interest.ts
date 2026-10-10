import "server-only";
import type { RowDataPacket } from "mysql2";
import { getDatabase } from "@/lib/db";
import { reportError } from "@/lib/monitoring/report-error";
import {
  findFraSubmissionId,
  getTier2InterestField,
  isZohoConfigured,
  updateFraSubmission,
  zohoDateTime,
  type CrmCall,
} from "@/lib/crm/adapter";
import { logServerEvent, type EventContext } from "@/lib/events/server";

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
 *
 * Writes `tier2_interest_recorded` to the event log whatever happens, and a
 * `zoho_push` row for every Zoho call (Event-Log-Spec §4.3, Decision T13).
 */
export async function pushTier2Interest(submissionId: number, events: EventContext) {
  let mobileGiven = false;
  let zohoPushed = false;
  const observe = (call: CrmCall) => void logServerEvent(events, "zoho_push", call, submissionId);

  try {
    const db = getDatabase();
    const [rows] = await db.query<InterestRow[]>(
      "SELECT email, phone, zoho_record_id, report_interest_at FROM audit_submissions WHERE id = ?",
      [submissionId],
    );
    const row = rows[0];
    if (!row?.report_interest_at) return;
    mobileGiven = Boolean(row.phone);

    const field = getTier2InterestField();
    if (!field || !isZohoConfigured()) {
      if (!field) console.info("ZOHO_TIER2_FIELD not set, skipping the Zoho interest push.");
      return;
    }

    let recordId = row.zoho_record_id ?? undefined;
    if (!recordId) {
      // Submissions saved before the record id was kept.
      recordId = await findFraSubmissionId(row.email, observe);
      if (!recordId) {
        console.warn(`No Zoho FRA submission found for submission ${submissionId}; interest not pushed.`);
        return;
      }
      await db.execute("UPDATE audit_submissions SET zoho_record_id = ? WHERE id = ?", [recordId, submissionId]);
    }

    await updateFraSubmission(
      recordId,
      {
        [field]: zohoDateTime(new Date(row.report_interest_at)),
        ...(row.phone ? { Phone: row.phone } : {}),
      },
      observe,
    );
    zohoPushed = true;
    console.info(`Zoho Tier 2 interest pushed (${recordId})`);
  } catch (error) {
    reportError("Zoho Tier 2 interest push failed", error, { submission_id: submissionId });
  } finally {
    await logServerEvent(
      events,
      "tier2_interest_recorded",
      { mobile_given: mobileGiven, zoho_pushed: zohoPushed },
      submissionId,
    );
  }
}
