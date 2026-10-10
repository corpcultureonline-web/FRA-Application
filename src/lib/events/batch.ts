/**
 * Parses and cleans a batch posted to /api/event (Event-Log-Spec §3). Pure, so
 * the rules are tested without a server.
 *
 * Never throws: a malformed body yields nothing, a malformed event is dropped
 * and counted, and the endpoint answers 204 either way.
 */
import { scrubEvent } from "../monitoring/scrub.ts";
import { CLIENT_EVENTS, UUID, type ClientEventType } from "./types.ts";

export const MAX_EVENTS_PER_BATCH = 100;
export const MAX_PAYLOAD_CHARS = 4000;
/** A client clock further than this from the server's is not trusted (§3). */
export const CLOCK_TOLERANCE_MS = 60 * 60 * 1000;

const CLIENT_EVENT_SET = new Set<string>(CLIENT_EVENTS);

export type CleanEvent = {
  type: ClientEventType;
  /** Epoch milliseconds — the client's, unless it was missing or suspect. */
  at: number;
  payload: Record<string, unknown>;
};

export type ParsedBatch = { sessionId: string; events: CleanEvent[]; rejected: number };

export function parseBatch(raw: string, now: number): ParsedBatch | null {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") return null;
  const { session_id: sessionId, events } = body as { session_id?: unknown; events?: unknown };
  if (typeof sessionId !== "string" || !UUID.test(sessionId) || !Array.isArray(events)) return null;

  const clean: CleanEvent[] = [];
  let rejected = Math.max(0, events.length - MAX_EVENTS_PER_BATCH);
  for (const event of events.slice(0, MAX_EVENTS_PER_BATCH)) {
    const parsed = parseEvent(event, now);
    if (parsed) clean.push(parsed);
    else rejected++;
  }
  return { sessionId: sessionId.toLowerCase(), events: clean, rejected };
}

function parseEvent(value: unknown, now: number): CleanEvent | null {
  if (!value || typeof value !== "object") return null;
  const { type, at, payload } = value as { type?: unknown; at?: unknown; payload?: unknown };
  if (typeof type !== "string" || !CLIENT_EVENT_SET.has(type)) return null;
  if (payload !== undefined && (payload === null || typeof payload !== "object" || Array.isArray(payload))) {
    return null;
  }

  // No personal data in the log (§8): the same scrub as error reports, which
  // also turns report tokens in paths into [token].
  const cleaned = scrubEvent({ ...(payload as Record<string, unknown> | undefined) }, {});
  if (JSON.stringify(cleaned).length > MAX_PAYLOAD_CHARS) return null;

  const clientAt = typeof at === "number" && Number.isFinite(at) ? at : null;
  const suspect = clientAt === null || Math.abs(clientAt - now) > CLOCK_TOLERANCE_MS;
  return {
    type: type as ClientEventType,
    at: suspect ? now : clientAt,
    payload: suspect ? { ...cleaned, clock_suspect: true } : cleaned,
  };
}
