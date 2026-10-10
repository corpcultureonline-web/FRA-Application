/**
 * Browser side of the event log (Event-Log-Spec §3–§4). Events are held in
 * memory and flushed every five seconds, on section change, and on page exit.
 *
 * Exit uses navigator.sendBeacon on visibilitychange → hidden: a normal fetch
 * is cancelled when the page closes, which would lose exactly the event that
 * says where someone quit, and beforeunload is unreliable on mobile Safari.
 *
 * Tracking never throws and never blocks the page.
 */
import { BASE_PATH, withBasePath } from "../base-path";
import { NEW_SESSION_COOKIE, SESSION_COOKIE, UUID, type ClientEventType } from "./types";

type QueuedEvent = { type: ClientEventType; at: number; payload: Record<string, unknown> };
type ExitContext = () => Record<string, unknown>;
type ExitHandler = () => QueuedEvent[] | void;

const ENDPOINT = withBasePath("/api/event");
const FLUSH_EVERY_MS = 5000;
const MAX_QUEUE = 500;

let sessionId: string | null = null;
let enabled = false;
let queue: QueuedEvent[] = [];
let pageStartedAt = Date.now();
let currentPath: string | null = null;
let previousPath: string | null = null;
let exitContext: ExitContext | null = null;
const exitHandlers = new Set<ExitHandler>();

function readCookie(name: string) {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAge?: number) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  const age = maxAge === undefined ? "" : `; max-age=${maxAge}`;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${BASE_PATH}; samesite=lax${age}${secure}`;
}

function body(events: QueuedEvent[]) {
  return JSON.stringify({ session_id: sessionId, events });
}

export function track(type: ClientEventType, payload: Record<string, unknown> = {}) {
  // A page's first event can come before the layout's tracker effect has run.
  if (!enabled) startTracking();
  if (!enabled) return;
  queue.push({ type, at: Date.now(), payload });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
}

/** Sends what is queued. Awaited before the audit is submitted, so the backfill finds every row. */
export async function flushEvents() {
  if (!enabled || !queue.length) return;
  const events = queue;
  queue = [];
  try {
    await fetch(ENDPOINT, { method: "POST", body: body(events), keepalive: true });
  } catch {
    // Offline for a moment: keep them for the next flush rather than lose them.
    queue = [...events, ...queue].slice(-MAX_QUEUE);
  }
}

/** What page_exit should say about the current page (the questionnaire's progress). */
export function setExitContext(context: ExitContext) {
  exitContext = context;
  return () => {
    if (exitContext === context) exitContext = null;
  };
}

/** Extra events to send in the exit beacon, such as result_engaged. */
export function onPageExit(handler: ExitHandler) {
  exitHandlers.add(handler);
  return () => {
    exitHandlers.delete(handler);
  };
}

/**
 * Called on every route change (app paths, without the base path), so
 * ms_in_page is per page and the previous page is known — in-app navigation
 * does not update document.referrer.
 */
export function markPage(path: string) {
  pageStartedAt = Date.now();
  if (path === currentPath) return;
  previousPath = currentPath;
  currentPath = path;
}

/** The app page before this one in this tab, e.g. "/" for the landing page. */
export function previousPage() {
  return previousPath;
}

function sendExit() {
  const extra = [...exitHandlers].flatMap((handler) => {
    try {
      return handler() ?? [];
    } catch {
      return [];
    }
  });
  let context: Record<string, unknown> = {};
  try {
    context = exitContext?.() ?? {};
  } catch {}
  const exit: QueuedEvent = {
    type: "page_exit",
    at: Date.now(),
    payload: { path: location.pathname, completed: false, ...context, ms_in_page: Date.now() - pageStartedAt },
  };
  const events = [...queue, ...extra, exit];
  queue = [];
  const sent = navigator.sendBeacon?.(ENDPOINT, body(events));
  if (!sent) fetch(ENDPOINT, { method: "POST", body: body(events), keepalive: true }).catch(() => {});
}

function deviceOf() {
  const width = window.innerWidth;
  return width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
}

/** Starts tracking once per page load. Off for the PDF render (print=1) and for automated browsers. */
export function startTracking() {
  if (enabled || typeof window === "undefined") return;
  const params = new URLSearchParams(location.search);
  if (params.get("print") === "1" || navigator.webdriver) return;

  sessionId = readCookie(SESSION_COOKIE);
  if (!sessionId || !UUID.test(sessionId)) {
    // The proxy normally sets this; never leave a session without one.
    sessionId = crypto.randomUUID();
    writeCookie(SESSION_COOKIE, sessionId);
    writeCookie(NEW_SESSION_COOKIE, "1");
  }
  enabled = true;

  if (readCookie(NEW_SESSION_COOKIE) === "1") {
    writeCookie(NEW_SESSION_COOKIE, "", 0);
    // Traffic source, captured once per session (§4.1). The referrer keeps
    // origin and path only — query strings can carry anything.
    let referrer: string | null = null;
    try {
      referrer = document.referrer ? `${new URL(document.referrer).origin}${new URL(document.referrer).pathname}` : null;
    } catch {}
    track("session_started", {
      landing_path: location.pathname,
      referrer,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
      device: deviceOf(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      lang: navigator.language || null,
    });
  }

  window.setInterval(() => void flushEvents(), FLUSH_EVERY_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendExit();
  });
}
