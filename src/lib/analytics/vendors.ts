/**
 * Browser calls into Clarity and Google Analytics (Instrumentation handoff,
 * 20 Nov 2026, §1 and §3). Both tags load after the page is interactive and
 * only where their own rules allow (live host, never print=1 or an automated
 * browser), so every call here waits briefly for the tag and is otherwise a
 * no-op. Nothing here may throw into the page.
 *
 * What may leave: our surrogate ids, the funnel position, the band. Never the
 * score (Event-Log-Spec §4.3, Scoring Spec §4), a name, an email, a phone or
 * a brand name.
 */

type Vendor = (...args: unknown[]) => void;

declare global {
  interface Window {
    clarity?: Vendor;
    gtag?: Vendor;
    /** Set by the Google tag when Analytics is on for this host (GoogleTag.tsx). */
    __fraAnalyticsId?: string;
  }
}

const WAIT_STEP_MS = 250;
const WAIT_TRIES = 20;

/** Resolves with the vendor function once its tag has run, or null after about five seconds. */
function waitFor(get: () => Vendor | undefined | null): Promise<Vendor | null> {
  return new Promise((resolve) => {
    let tries = WAIT_TRIES;
    const check = () => {
      const fn = typeof window === "undefined" ? null : get();
      if (typeof fn === "function") return resolve(fn);
      if (--tries <= 0) return resolve(null);
      window.setTimeout(check, WAIT_STEP_MS);
    };
    check();
  });
}

const clarity = () => waitFor(() => window.clarity);

/**
 * §1.1: our ids into Clarity, so any event_log session can be found in its
 * recordings. Called on every page load, as Clarity asks. Resolves true when
 * Clarity was there to receive them.
 */
export async function clarityIdentify(visitorId: string, sessionId: string) {
  const fn = await clarity();
  if (!fn) return false;
  try {
    fn("identify", visitorId, sessionId);
    return true;
  } catch {
    return false;
  }
}

/** §1.2: a custom tag (tier, stage, band, source), for Clarity's filters. */
export function claritySet(key: string, value: string | string[]) {
  void clarity().then((fn) => {
    try {
      fn?.("set", key, value);
    } catch {}
  });
}

/** §1.3: puts this session on Clarity's watchlist. */
export function clarityUpgrade(reason: "paid_questions_incomplete" | "section1_exit") {
  void clarity().then((fn) => {
    try {
      fn?.("upgrade", reason);
    } catch {}
  });
}

/** §3.3: the browser events mirrored to GA4. The paid ones go from the server (ga-server.ts). */
const GA_MIRRORED = new Set([
  "audit_started",
  "section_completed",
  "audit_submitted",
  "result_viewed",
  "cta_clicked",
  "video_started",
  "story_cta_clicked",
]);

/**
 * Sends one of the mirrored events to Analytics only (send_to), never to the
 * Ads account, with flat values only. Nothing when Analytics is off here.
 */
export function mirrorToGa(type: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined" || !GA_MIRRORED.has(type)) return;
  const id = window.__fraAnalyticsId;
  if (!id || typeof window.gtag !== "function") return;
  const params: Record<string, string | number | boolean> = { send_to: id };
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "number" || typeof value === "boolean") params[key] = value;
    else if (typeof value === "string") params[key] = value.slice(0, 100);
  }
  try {
    window.gtag("event", type, params);
  } catch {}
}

/**
 * §3.2: reads a field back from gtag. gtag("get") answers nothing until
 * gtag.js has initialised, and fails silently, so it is retried.
 */
export async function gaField(field: "client_id" | "session_id", tries = 10): Promise<string | null> {
  const gtag = await waitFor(() => (window.__fraAnalyticsId ? window.gtag : null));
  const id = window.__fraAnalyticsId;
  if (!gtag || !id) return null;
  for (let left = tries; left >= 0; left--) {
    const value = await new Promise<string | null>((resolve) => {
      const timer = window.setTimeout(() => resolve(null), 1000);
      try {
        gtag("get", id, field, (v: unknown) => {
          window.clearTimeout(timer);
          resolve(v ? String(v) : null);
        });
      } catch {
        window.clearTimeout(timer);
        resolve(null);
      }
    });
    if (value) return value;
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }
  return null;
}
