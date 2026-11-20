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
  // The founder video on the landing page (Instrumentation handoff, 20 Nov, §2.3–§2.4).
  "video_impression",
  "video_play_click",
  "video_started",
  "video_progress",
  "video_completed",
  "video_paused",
  "video_abandoned",
  "story_cta_clicked",
  "story_watch_clicked",
  // Once per session: the GA ids, read in the browser, and whether Clarity was told ours (§3.2).
  "analytics_linked",
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
  // The Report's lifecycle (Event-Log-Spec v1.3 §4.3b).
  "payment_succeeded",
  "payment_failed",
  "questionnaire_submitted",
  // Field Help §7 / T48: written by the server as the answer is saved, with the order.
  "contradiction_warned",
  "help_page_opened",
  // The Report (§4.3b): generated at submission, then the tracked link (T77).
  "report_generated",
  "report_link_clicked",
  "report_opened",
  "report_section_read",
  "report_pdf_downloaded",
  "report_cta_clicked",
  // The review panel (Admin library v1.3, Event-Log-Spec §4.3b).
  "report_approved",
  "report_returned",
  "report_sent",
  "refund_issued",
  // Identity and lifecycle (Identity handoff, 20 Nov, §5–§6).
  "visitor_created",
  "identity_resolved",
  "identity_merged",
  "state_changed",
] as const;

export type ClientEventType = (typeof CLIENT_EVENTS)[number];
export type ServerEventType = (typeof SERVER_EVENTS)[number];

/** Session id, set by the proxy on the first request of a browser session. */
export const SESSION_COOKIE = "fra_sid";
/** Present only on the response that created the session: the tracker sends session_started once. */
export const NEW_SESSION_COOKIE = "fra_new";
/** Set by ?internal=1 for the rest of the session (§7). */
export const INTERNAL_COOKIE = "fra_internal";
/**
 * The browser across sessions (Identity handoff §4): a UUID kept in
 * localStorage and mirrored in this cookie, so server-side events carry it too.
 */
export const VISITOR_COOKIE = "fra_vid";
export const VISITOR_STORAGE_KEY = "fra_vid";
/** About 400 days, the longest a browser keeps a cookie. */
export const VISITOR_MAX_AGE = 400 * 24 * 60 * 60;
/** The campaign that started this session, so a second ad click starts a new one (§4). */
export const CAMPAIGN_COOKIE = "fra_camp";
/** Request headers the proxy forwards, so the first request already has a session. */
export const SESSION_HEADER = "x-fra-session";
export const VISITOR_HEADER = "x-fra-visitor";
export const INTERNAL_HEADER = "x-fra-internal";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
