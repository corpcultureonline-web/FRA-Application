import { NextResponse, type NextRequest } from "next/server";
import { BASE_PATH } from "@/lib/base-path";
import {
  INTERNAL_COOKIE,
  INTERNAL_HEADER,
  NEW_SESSION_COOKIE,
  SESSION_COOKIE,
  SESSION_HEADER,
  UUID,
} from "@/lib/events/types";

/**
 * Gives every browser session an id for the event log (Event-Log-Spec §2),
 * and marks ?internal=1 sessions (§7). Session cookies — no expiry — scoped
 * to the app's path, so nothing reaches the WordPress site.
 *
 * The id is also forwarded as a request header, so a server-side event on the
 * session's very first request (a result opened from an email) is attributed.
 */
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existing && UUID.test(existing) ? existing : crypto.randomUUID();
  const internal =
    request.nextUrl.searchParams.get("internal") === "1" || request.cookies.get(INTERNAL_COOKIE)?.value === "1";

  const headers = new Headers(request.headers);
  headers.set(SESSION_HEADER, sessionId);
  if (internal) headers.set(INTERNAL_HEADER, "1");
  else headers.delete(INTERNAL_HEADER);

  const response = NextResponse.next({ request: { headers } });
  const options = { path: BASE_PATH, sameSite: "lax" as const, secure: request.nextUrl.protocol === "https:" };
  if (sessionId !== existing) {
    response.cookies.set(SESSION_COOKIE, sessionId, options);
    // Read once by the tracker, which sends session_started and clears it.
    response.cookies.set(NEW_SESSION_COOKIE, "1", options);
  }
  if (internal) response.cookies.set(INTERNAL_COOKIE, "1", options);
  return response;
}

export const config = {
  // Pages and API routes; not build assets, images or files with an extension.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
