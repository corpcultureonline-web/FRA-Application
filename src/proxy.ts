import { NextResponse, type NextRequest } from "next/server";
import { BASE_PATH } from "@/lib/base-path";
import { isNoIndex } from "@/lib/seo";
import { campaignSignature } from "@/lib/events/attribution";
import {
  CAMPAIGN_COOKIE,
  INTERNAL_COOKIE,
  INTERNAL_HEADER,
  NEW_SESSION_COOKIE,
  SESSION_COOKIE,
  SESSION_HEADER,
  UUID,
  VISITOR_COOKIE,
  VISITOR_HEADER,
  VISITOR_MAX_AGE,
} from "@/lib/events/types";

/**
 * Gives every browser session an id for the event log (Event-Log-Spec §2),
 * and marks ?internal=1 sessions (§7). Session cookies — no expiry — scoped
 * to the app's path, so nothing reaches the WordPress site.
 *
 * The id is also forwarded as a request header, so a server-side event on the
 * session's very first request (a result opened from an email) is attributed.
 *
 * Every browser also gets a visitor id that outlives the session (Identity
 * handoff, 20 Nov, §4), and a new campaign click starts a new session even
 * mid-session, so a second ad click is not credited to the first.
 */
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  const campaign = campaignSignature(request.nextUrl.searchParams);
  const newCampaign = campaign !== null && campaign !== request.cookies.get(CAMPAIGN_COOKIE)?.value;
  const sessionId = existing && UUID.test(existing) && !newCampaign ? existing : crypto.randomUUID();
  const existingVisitor = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitor && UUID.test(existingVisitor) ? existingVisitor : crypto.randomUUID();
  const internal =
    request.nextUrl.searchParams.get("internal") === "1" || request.cookies.get(INTERNAL_COOKIE)?.value === "1";

  const headers = new Headers(request.headers);
  headers.set(SESSION_HEADER, sessionId);
  headers.set(VISITOR_HEADER, visitorId);
  if (internal) headers.set(INTERNAL_HEADER, "1");
  else headers.delete(INTERNAL_HEADER);

  const response = NextResponse.next({ request: { headers } });
  const options = { path: BASE_PATH, sameSite: "lax" as const, secure: request.nextUrl.protocol === "https:" };
  if (sessionId !== existing) {
    response.cookies.set(SESSION_COOKIE, sessionId, options);
    // Read once by the tracker, which sends session_started and clears it.
    response.cookies.set(NEW_SESSION_COOKIE, "1", options);
  }
  if (newCampaign) response.cookies.set(CAMPAIGN_COOKIE, campaign, options);
  // The tracker mirrors its localStorage copy back into this cookie (client.ts).
  if (visitorId !== existingVisitor) response.cookies.set(VISITOR_COOKIE, visitorId, { ...options, maxAge: VISITOR_MAX_AGE });
  if (internal) response.cookies.set(INTERNAL_COOKIE, "1", options);
  // A staging copy: every page and API response says noindex, whatever its
  // own metadata says (seo.ts).
  if (isNoIndex()) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Pages and API routes; not build assets, images or files with an extension.
  // "/" too: the landing page at the bare base path (/franchise-audit) matches
  // nothing else, and went out without X-Robots-Tag on staging (2 Nov, T1).
  matcher: ["/", "/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
