import { getDatabase } from "@/lib/db";
import { parseBatch } from "@/lib/events/batch";
import { withAnswerValues } from "@/lib/events/payloads";
import { eventContext, requestIp, sessionSubmission, writeEvents } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { getScoringConfig } from "@/lib/scoring/config";

const RATE_LIMIT = 200;
const RATE_WINDOW_MS = 60_000;
const recent = new Map<string, { windowStart: number; count: number }>();

/** 200 events a minute per IP (§3). In memory: the app runs as one process. */
function allow(ip: string, events: number, now: number) {
  const entry = recent.get(ip);
  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
    if (recent.size > 10_000) recent.clear();
    recent.set(ip, { windowStart: now, count: events });
    return events <= RATE_LIMIT;
  }
  entry.count += events;
  return entry.count <= RATE_LIMIT;
}

const noContent = () => new Response(null, { status: 204 });

/**
 * POST /api/event — the event log's only endpoint (Event-Log-Spec §3).
 * Anonymous and batched. Answers 204 always, even for a malformed body, so a
 * logging problem can never surface to a founder mid-questionnaire.
 */
export async function POST(request: Request) {
  const now = Date.now();
  try {
    // sendBeacon posts text/plain, so read the raw body rather than .json().
    const batch = parseBatch(await request.text(), now);
    if (!batch) {
      console.warn("Event batch rejected: malformed body");
      return noContent();
    }
    if (batch.rejected) console.warn(`Event batch: ${batch.rejected} event(s) rejected`);
    if (!batch.events.length) return noContent();

    const ip = requestIp(request.headers);
    if (!allow(ip, batch.events.length, now)) {
      console.warn(`Event batch dropped: rate limit for ${ip}`);
      return noContent();
    }

    const db = getDatabase();
    const [config, submissionId] = await Promise.all([
      getScoringConfig().catch(() => null),
      sessionSubmission(db, batch.sessionId),
    ]);
    // The session in the body is the tracker's; internal comes from the cookie or IP.
    const context = { ...eventContext(request.headers), sessionId: batch.sessionId };
    await writeEvents(
      db,
      context,
      batch.events.map((event) => ({
        type: event.type,
        at: event.at,
        payload: config ? withAnswerValues(config, event.type, event.payload) : event.payload,
        submissionId,
      })),
    );
  } catch (error) {
    reportError("Event batch write failed", error);
  }
  return noContent();
}
