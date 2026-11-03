import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import {
  findFraSubmissionId,
  getTier3InterestField,
  isZohoConfigured,
  updateFraSubmission,
  zohoDateTime,
  type CrmCall,
} from "@/lib/crm/adapter";
import { getDatabase } from "@/lib/db";
import { logOrderEvent, logServerEvent, type EventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";

/**
 * "Tell me about the Roadmap" (Report library v1.11 §3, T127). The Roadmap is
 * not built, so the button registers interest in place, the way the Audit's
 * result page does for the Report (Tier 1 result page §20): the MySQL record
 * first, then a fire-and-forget push to the brand's Zoho record as
 * `Tier_3_Interest_At`, so a Zoho workflow can alert the team. No phone field:
 * the mobile came at checkout.
 */

/** Saves the interest once (a second tap keeps the first time). Returns when it was registered. */
export async function registerRoadmapInterest(context: EventContext, orderId: number, auditId: number): Promise<Date> {
  const db = getDatabase();
  await db.execute(
    "UPDATE report_orders SET roadmap_interest_at = COALESCE(roadmap_interest_at, CURRENT_TIMESTAMP(3)) WHERE id = ?",
    [orderId],
  );
  const [rows] = await db.query<RowDataPacket[]>("SELECT roadmap_interest_at FROM report_orders WHERE id = ?", [orderId]);
  await logOrderEvent(context, "report_cta_clicked", { order_id: orderId, target: "roadmap" }, orderId, auditId);
  return new Date(rows[0].roadmap_interest_at);
}

/** The Zoho push. Never throws: the interest is already saved, so a failure is logged and nothing more. */
export async function pushRoadmapInterest(context: EventContext, auditId: number, at: Date) {
  // The Zoho Date/Time field, e.g. Tier_3_Interest_At. Unset: the push is skipped, the interest still saved.
  const field = getTier3InterestField();
  if (!field || !isZohoConfigured()) {
    if (!field) console.info("ZOHO_TIER3_FIELD not set, skipping the Zoho Roadmap-interest push.");
    return;
  }
  const observe = (call: CrmCall) => void logServerEvent(context, "zoho_push", call, auditId);
  try {
    const db = getDatabase();
    const [rows] = await db.query<RowDataPacket[]>("SELECT email, zoho_record_id FROM audit_submissions WHERE id = ?", [auditId]);
    const row = rows[0];
    if (!row) return;
    let recordId: string | undefined = row.zoho_record_id ?? undefined;
    if (!recordId) {
      recordId = await findFraSubmissionId(row.email, observe);
      if (!recordId) {
        console.warn(`No Zoho FRA submission found for audit ${auditId}; Roadmap interest not pushed.`);
        return;
      }
      await db.execute("UPDATE audit_submissions SET zoho_record_id = ? WHERE id = ?", [recordId, auditId]);
    }
    await updateFraSubmission(recordId, { [field]: zohoDateTime(at) }, observe);
  } catch (error) {
    reportError("Roadmap interest Zoho push failed", error, { submission_id: auditId });
  }
}
