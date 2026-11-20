import "server-only";
import { randomUUID } from "node:crypto";
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";
import { reportError } from "@/lib/monitoring/report-error";
import {
  INTERNAL_COOKIE,
  INTERNAL_HEADER,
  SESSION_COOKIE,
  SESSION_HEADER,
  UUID,
  VISITOR_COOKIE,
  VISITOR_HEADER,
  type ServerEventType,
} from "./types";

type Executor = Pick<Pool | PoolConnection, "execute">;

/** visitorId is null only where no browser is involved (Razorpay's webhook, a script). */
export type EventContext = { sessionId: string; internal: boolean; visitorId: string | null };

export type EventRow = {
  type: string;
  payload: Record<string, unknown> | null;
  /** Epoch ms; server time when absent. */
  at?: number;
  submissionId?: number | null;
  /** Our own order id on paid runs (Event-Log-Spec v1.3 §2, T82). */
  orderId?: number | null;
  /** When the writer already knows it; otherwise looked up (personFor). */
  personId?: number | null;
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
  const visitor = cookie(headers, VISITOR_COOKIE) ?? headers.get(VISITOR_HEADER);
  return { sessionId, internal, visitorId: visitor && UUID.test(visitor) ? visitor.toLowerCase() : null };
}

export function requestIp(headers: Headers) {
  return clientIp(headers) ?? "unknown";
}

/** Migration 018 not run yet: MySQL's "unknown column" and "no such table". */
export function isMissingSchema(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "ER_BAD_FIELD_ERROR" || code === "ER_NO_SUCH_TABLE";
}

const SCHEMA_RECHECK_MS = 5 * 60_000;
let schemaMissingUntil = 0;

/**
 * False for five minutes after migration 018's columns or tables were found
 * missing. Until it runs, the log is written as before and identity work is
 * skipped, so a deploy ahead of the migration never stops an Audit.
 */
export function identitySchemaReady() {
  return Date.now() >= schemaMissingUntil;
}

export function noteMissingSchema() {
  if (identitySchemaReady()) {
    console.warn("Identity tables missing (migration 018 not run): event log written without visitor_id/person_id.");
  }
  schemaMissingUntil = Date.now() + SCHEMA_RECHECK_MS;
}

/**
 * The person behind an event (Identity handoff §4): the browser's, once it is
 * identified; otherwise the brand's, through the Audit or order the event
 * belongs to (Razorpay's webhook has no browser). Null until Section 1.
 */
export async function personFor(
  db: Executor,
  visitorId: string | null,
  ids: { submissionId?: number | null; orderId?: number | null },
) {
  if (visitorId) {
    const [rows] = await db.execute<RowDataPacket[]>("SELECT person_id FROM visitor WHERE visitor_id = ?", [visitorId]);
    const personId = rows[0]?.person_id as number | null | undefined;
    if (personId) return personId;
  }
  if (!ids.submissionId && !ids.orderId) return null;
  // The same normalisation as contactHashes (identity-rules.ts): +91 and ten digits; lowercased, trimmed email.
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT p.person_id
       FROM audit_submissions s
       JOIN person p
         ON p.phone_hash = SHA2(CONCAT('+91', s.phone), 256) OR p.email_hash = SHA2(LOWER(TRIM(s.email)), 256)
      WHERE s.id = COALESCE(?, (SELECT o.audit_submission_id FROM report_orders o WHERE o.id = ?))
      ORDER BY p.person_id
      LIMIT 1`,
    [ids.submissionId ?? null, ids.orderId ?? null],
  );
  return (rows[0]?.person_id as number | undefined) ?? null;
}

/**
 * Appends rows. The only writes besides the submission and person backfills —
 * nothing else touches the table. Every row carries the session, the visitor
 * and, once known, the person (Identity handoff §4).
 */
export async function writeEvents(db: Executor, context: EventContext, rows: EventRow[]) {
  if (!rows.length) return;
  const now = Date.now();
  const common = (row: EventRow) => [
    row.submissionId ?? null,
    row.orderId ?? null,
    row.type,
    row.payload ? JSON.stringify(row.payload) : null,
    context.internal,
    ((row.at ?? now) / 1000).toFixed(3),
  ];

  if (identitySchemaReady()) {
    try {
      const anchor = rows.find((row) => row.submissionId || row.orderId);
      const lookedUp = rows.some((row) => row.personId == null)
        ? await personFor(db, context.visitorId, { submissionId: anchor?.submissionId, orderId: anchor?.orderId })
        : null;
      await db.execute(
        `INSERT INTO event_log
           (session_id, visitor_id, person_id, submission_id, order_id, event_type, payload, is_internal, created_at)
         VALUES ${rows.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))").join(", ")}`,
        rows.flatMap((row) => [context.sessionId, context.visitorId, row.personId ?? lookedUp, ...common(row)]),
      );
      return;
    } catch (error) {
      if (!isMissingSchema(error)) throw error;
      noteMissingSchema();
    }
  }
  // Before migration 018: the columns as they were.
  await db.execute(
    `INSERT INTO event_log (session_id, submission_id, order_id, event_type, payload, is_internal, created_at)
     VALUES ${rows.map(() => "(?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))").join(", ")}`,
    rows.flatMap((row) => [context.sessionId, ...common(row)]),
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
  personId: number | null = null,
) {
  try {
    await writeEvents(getDatabase(), context, [{ type, payload, submissionId, personId }]);
  } catch (error) {
    reportError(`Event log write failed (${type})`, error, { submission_id: submissionId ?? undefined });
  }
}

/**
 * A server-side event on a paid run, carrying our order id in the column the
 * run is joined on. Fire-and-forget, like logServerEvent.
 */
export async function logOrderEvent(
  context: EventContext,
  // The Report's answers are logged as they are saved, so question_answered and
  // answer_changed come from the server on a paid run, not the tracker.
  type: ServerEventType | "question_answered" | "answer_changed",
  payload: Record<string, unknown>,
  orderId: number,
  submissionId: number | null = null,
) {
  try {
    await writeEvents(getDatabase(), context, [{ type, payload, orderId, submissionId }]);
  } catch (error) {
    reportError(`Event log write failed (${type})`, error, { order_id: orderId });
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
 * Identity handoff §6.2: attaches this browser's anonymous events — and this
 * session's, for a session that began before visitors existed — to the person.
 * The second permitted write to an existing row. Returns the rows stitched.
 */
export async function backfillPerson(db: Executor, context: EventContext, personId: number) {
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE event_log SET person_id = ?
      WHERE person_id IS NULL AND (session_id = ? OR (visitor_id IS NOT NULL AND visitor_id = ?))`,
    [personId, context.sessionId, context.visitorId],
  );
  return result.affectedRows;
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
