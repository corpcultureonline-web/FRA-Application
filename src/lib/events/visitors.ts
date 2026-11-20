import "server-only";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { classify, type RawTouch, type Touch } from "./attribution";
import { identitySchemaReady, isMissingSchema, noteMissingSchema, type EventContext, type EventRow } from "./server";

/** Last-touch fields a self-referral inherits from the visitor's previous session (§3.4). */
const INHERITED = ["channel", "source", "medium", "campaign", "click_id_type"] as const;

async function previousTouch(db: Pick<Pool, "execute">, visitorId: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT payload FROM event_log
      WHERE visitor_id = ? AND event_type = 'session_started' AND JSON_EXTRACT(payload, '$.channel') IS NOT NULL
      ORDER BY id DESC LIMIT 1`,
    [visitorId],
  );
  const payload = rows[0]?.payload;
  return (typeof payload === "string" ? JSON.parse(payload) : payload) as Record<string, unknown> | undefined;
}

/**
 * session_started, enriched on write (Identity handoff §3.1–§3.2): the
 * normalised last touch beside the raw UTMs, which stay as they came. A visit
 * from our own domain inherits the visitor's previous channel instead of
 * resetting it. Returns the payload to store and the touch for the visitor row.
 */
export async function lastTouch(db: Pick<Pool, "execute">, context: EventContext, payload: Record<string, unknown>) {
  const { touch, selfReferral } = classify(payload as RawTouch);
  const enriched: Record<string, unknown> = {
    ...payload,
    channel: touch.channel,
    source: touch.source,
    medium: touch.medium,
    campaign: touch.campaign,
    referrer_host: touch.referrer_host,
    click_id_type: touch.click_id_type,
  };
  if (selfReferral && context.visitorId && identitySchemaReady()) {
    const previous = await previousTouch(db, context.visitorId).catch((error) => {
      if (!isMissingSchema(error)) throw error;
      noteMissingSchema();
      return undefined;
    });
    if (previous) {
      for (const key of INHERITED) enriched[key] = previous[key] ?? null;
      enriched.inherited = true;
    }
  }
  return { payload: enriched, touch };
}

/**
 * The visitor row (§2.2, §3.1): created on the browser's first session with
 * its first touch frozen — INSERT, never UPDATE, for those fields — and seen
 * again on every batch after. Returns the visitor_created row to write, once.
 */
export async function touchVisitor(
  db: Pick<Pool, "execute">,
  context: EventContext,
  at: number,
  firstTouch: Touch | null,
): Promise<EventRow | null> {
  if (!context.visitorId || !identitySchemaReady()) return null;
  try {
    return await upsertVisitor(db, context.visitorId, at, firstTouch);
  } catch (error) {
    if (!isMissingSchema(error)) throw error;
    noteMissingSchema();
    return null;
  }
}

async function upsertVisitor(
  db: Pick<Pool, "execute">,
  visitorId: string,
  at: number,
  firstTouch: Touch | null,
): Promise<EventRow | null> {
  const context = { visitorId };
  const seconds = (at / 1000).toFixed(3);
  if (!firstTouch) {
    await db.execute(
      "UPDATE visitor SET last_seen_at = GREATEST(last_seen_at, FROM_UNIXTIME(?)) WHERE visitor_id = ?",
      [seconds, context.visitorId],
    );
    return null;
  }
  const t = firstTouch;
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO visitor
       (visitor_id, first_seen_at, last_seen_at, ft_channel, ft_source, ft_medium, ft_campaign, ft_content,
        ft_term, ft_referrer_host, ft_landing_path, ft_click_id, ft_click_id_type)
     VALUES (?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE last_seen_at = GREATEST(last_seen_at, VALUES(last_seen_at))`,
    [
      context.visitorId,
      seconds,
      seconds,
      t.channel,
      t.source?.slice(0, 64) ?? null,
      t.medium?.slice(0, 64) ?? null,
      t.campaign,
      t.content,
      t.term,
      t.referrer_host,
      t.landing_path,
      t.click_id,
      t.click_id_type,
    ],
  );
  // 1 = inserted; 2 or 0 = the row was already there, first touch untouched.
  if (result.affectedRows !== 1) return null;
  return {
    type: "visitor_created",
    at,
    payload: {
      channel: t.channel,
      source: t.source,
      medium: t.medium,
      campaign: t.campaign,
      referrer_host: t.referrer_host,
      landing_path: t.landing_path,
      click_id_type: t.click_id_type,
    },
  };
}
