/**
 * Event log vocabulary (Event-Log-Spec v1.0 §4). Shared by the browser
 * tracker, the /api/event endpoint and the server-side writers.
 */

/** Events the browser may send to /api/event. */
export const CLIENT_EVENTS = [
  "session_started",
  "audit_started",
  "question_answered",
  "answer_changed",
  "section_completed",
  "audit_submitted",
  "result_engaged",
  "cta_clicked",
  "page_exit",
] as const;

/**
 * Written by the server only. /api/event drops them, so nobody can forge a
 * score or a Zoho push from the browser. zoho_push is the outbound-call log
 * (Decision T13, CANONICAL-VALUES §5).
 */
export const SERVER_EVENTS = [
  "audit_scored",
  "result_viewed",
  "pdf_downloaded",
  "tier2_interest_recorded",
  "zoho_push",
] as const;

export type ClientEventType = (typeof CLIENT_EVENTS)[number];
export type ServerEventType = (typeof SERVER_EVENTS)[number];

/** Session id, set by the proxy on the first request of a browser session. */
export const SESSION_COOKIE = "fra_sid";
/** Present only on the response that created the session: the tracker sends session_started once. */
export const NEW_SESSION_COOKIE = "fra_new";
/** Set by ?internal=1 for the rest of the session (§7). */
export const INTERNAL_COOKIE = "fra_internal";
/** Request headers the proxy forwards, so the first request already has a session. */
export const SESSION_HEADER = "x-fra-session";
export const INTERNAL_HEADER = "x-fra-internal";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
