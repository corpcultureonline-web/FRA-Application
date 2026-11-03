import { NextResponse } from "next/server";
import { EmailUnavailable } from "@/lib/messages/email";
import { sendFreshLink } from "@/lib/messages/start-run";
import { reportError } from "@/lib/monitoring/report-error";
import { resolveResumeLink } from "@/lib/payments/resume";

const RECENT_MS = 60_000;
const recent = new Map<string, number>();

/**
 * "Send me a new link" (Resume §4). The token only identifies the order; the
 * link goes to the address on that order, never anywhere supplied here. One
 * send a minute per link, so the button cannot be used to flood an inbox.
 * 204 only once the email has actually gone.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/resume/[token]/relink">) {
  const { token } = await ctx.params;
  const now = Date.now();
  if ((recent.get(token) ?? 0) > now - RECENT_MS) return new NextResponse(null, { status: 204 });

  try {
    const link = await resolveResumeLink(token);
    if (!link || link.submitted) return new NextResponse(null, { status: 404 });
    await sendFreshLink(link.orderId);
    recent.set(token, now);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof EmailUnavailable) {
      console.warn("Fresh resume link not sent: email is not configured.");
      return new NextResponse(null, { status: 503 });
    }
    reportError("Fresh resume link failed", error);
    return new NextResponse(null, { status: 500 });
  }
}
