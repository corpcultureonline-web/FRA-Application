import "server-only";
import { randomUUID } from "node:crypto";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";
import { reportError } from "@/lib/monitoring/report-error";
import {
  INTERNAL_COOKIE,
  INTERNAL_HEADER,
  SESSION_COOKIE,
  SESSION_HEADER,
  UUID,
  type ServerEventType,
} from "./types";

type Executor = Pick<Pool | PoolConnection, "execute">;

export type EventContext = { sessionId: string; internal: boolean };

export type EventRow = {
  type: string;
  payload: Record<string, unknown> | null;
  /** Epoch ms; server time when absent. */
  at?: number;
  submissionId?: number | null;
};

function cookie(headers: Headers, name: string) {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(headers.get("cookie") ?? "");
  return match ? decodeURIComponent(match[1]) : null;
}

function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip")?.trim() || null;
}

/** Office IPs, comma-separated in INTERNAL_IPS (§7). */
function isInternalIp(ip: string | null) {
  if (!ip) return false;
  const list = (process.env.INTERNAL_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(ip);
}

/**
 * The session and internal flag for a request. The proxy forwards both as
 * headers, so even the first request of a session — before the browser has
 * the cookie — is attributed.
 */
export function eventContext(headers: Headers): EventContext {
  const fromProxy = headers.get(SESSION_HEADER) ?? cookie(headers, SESSION_COOKIE);
  const sessionId = fromProxy && UUID.test(fromProxy) ? fromProxy.toLowerCase() : randomUUID();
  const internal =
    headers.get(INTERNAL_HEADER) === "1" || cookie(headers, INTERNAL_COOKIE) === "1" || isInternalIp(clientIp(headers));
  return { sessionId, internal };
}

export function requestIp(headers: Headers) {
  return clientIp(headers) ?? "unknown";
}

/** Appends rows. The only write besides backfillSubmission — nothing else touches the table. */
export async function writeEvents(db: Executor, context: EventContext, rows: EventRow[]) {
  if (!rows.length) return;
  const now = Date.now();
  const values = rows.flatMap((row) => [
    context.sessionId,
    row.submissionId ?? null,
    row.type,
    row.payload ? JSON.stringify(row.payload) : null,
    context.internal,
    ((row.at ?? now) / 1000).toFixed(3),
  ]);
  await db.execute(
    `INSERT INTO event_log (session_id, submission_id, event_type, payload, is_internal, created_at)
     VALUES ${rows.map(() => "(?, ?, ?, ?, ?, FROM_UNIXTIME(?))").join(", ")}`,
    values,
  );
}

/**
 * A server-side event, fire-and-forget: a failed log write must never fail
 * the request it describes.
 */
export async function logServerEvent(
  context: EventContext,
  type: ServerEventType,
  payload: Record<string, unknown>,
  submissionId: number | null = null,
) {
  try {
    await writeEvents(getDatabase(), context, [{ type, payload, submissionId }]);
  } catch (error) {
    reportError(`Event log write failed (${type})`, error, { submission_id: submissionId ?? undefined });
  }
}

/**
 * §5: attaches the session's anonymous events to the brand's submission. Run
 * in the transaction that writes the submission.
 */
export async function backfillSubmission(db: Executor, sessionId: string, submissionId: number) {
  await db.execute("UPDATE event_log SET submission_id = ? WHERE session_id = ? AND submission_id IS NULL", [
    submissionId,
    sessionId,
  ]);
}

/**
 * The submission a session has already completed, so events that arrive after
 * scoring (result engagement, exit) are written already attached.
 */
export async function sessionSubmission(db: Pick<Pool, "query">, sessionId: string) {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT submission_id FROM event_log WHERE session_id = ? AND submission_id IS NOT NULL ORDER BY id DESC LIMIT 1",
    [sessionId],
  );
  return (rows[0]?.submission_id as number | undefined) ?? null;
}

/** `result_viewed`, numbered per submission — a repeat visit is itself a signal (§4.3). */
export async function logResultViewed(context: EventContext, submissionId: number) {
  try {
    const db = getDatabase();
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS views FROM event_log WHERE submission_id = ? AND event_type = 'result_viewed'",
      [submissionId],
    );
    const visitNumber = Number(rows[0]?.views ?? 0) + 1;
    await writeEvents(db, context, [
      { type: "result_viewed", payload: { render: "web", visit_number: visitNumber }, submissionId },
    ]);
  } catch (error) {
    reportError("Event log write failed (result_viewed)", error, { submission_id: submissionId });
  }
}
