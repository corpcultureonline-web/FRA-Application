import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { GOOGLE_ANALYTICS_ID } from "@/components/GoogleTag";
import { getDatabase } from "@/lib/db";
import { reportError } from "@/lib/monitoring/report-error";

const ENDPOINT = "https://www.google-analytics.com/mp/collect";

/** The server-side events mirrored to GA4 (Instrumentation handoff, 20 Nov, §3.3–§3.4). */
export type GaServerEvent = "payment_succeeded" | "questionnaire_submitted" | "report_sent";

/**
 * The GA ids the founder's browser reported (analytics_linked, §3.2), from
 * any session of this order or of the Audit it upgrades. Null when the
 * browser never loaded Analytics (staging, a blocker, an automated browser).
 */
async function gaIdsFor(orderId: number) {
  const [rows] = await getDatabase().execute<RowDataPacket[]>(
    `SELECT JSON_UNQUOTE(JSON_EXTRACT(e.payload, '$.ga_client_id'))  AS client_id,
            JSON_UNQUOTE(JSON_EXTRACT(e.payload, '$.ga_session_id')) AS session_id
       FROM event_log e
      WHERE e.event_type = 'analytics_linked'
        AND JSON_EXTRACT(e.payload, '$.ga_client_id') IS NOT NULL
        AND e.session_id IN (
          SELECT r.session_id FROM event_log r
           WHERE r.order_id = ?
              OR r.submission_id = (SELECT o.audit_submission_id FROM report_orders o WHERE o.id = ?))
      ORDER BY e.id DESC
      LIMIT 1`,
    [orderId, orderId],
  );
  const row = rows[0];
  return row?.client_id ? { clientId: String(row.client_id), sessionId: row.session_id ? String(row.session_id) : null } : null;
}

/**
 * Sends a paid-run event to GA4 from the server (§3.4): a purchase reported
 * by the browser can fail, double-fire or be forged, and Instagram's in-app
 * browser loses many. Only the server sends these, and each carries an
 * event_id, so a sale is never counted twice.
 *
 * Needs GA4_API_SECRET (GA → Admin → Data streams → Measurement Protocol API
 * secrets); set it on live only, so staging never reports. Best effort: GA
 * being down never touches the payment or the Report.
 */
export async function sendGaServerEvent(name: GaServerEvent, orderId: number, params: Record<string, string | number> = {}) {
  const secret = process.env.GA4_API_SECRET?.trim();
  if (!secret) return;
  try {
    const ids = await gaIdsFor(orderId);
    if (!ids) {
      console.info(`GA4 ${name} for order ${orderId} not sent: no GA client id was linked to it.`);
      return;
    }
    const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(GOOGLE_ANALYTICS_ID)}&api_secret=${encodeURIComponent(secret)}`;
    const response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        client_id: ids.clientId,
        events: [
          {
            name,
            params: {
              ...params,
              order_id: orderId,
              event_id: `${name}-${orderId}`,
              ...(ids.sessionId ? { session_id: ids.sessionId } : {}),
              engagement_time_msec: 1,
            },
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`GA4 Measurement Protocol answered ${response.status}`);
  } catch (error) {
    reportError(`GA4 ${name} failed`, error, { order_id: orderId });
  }
}
