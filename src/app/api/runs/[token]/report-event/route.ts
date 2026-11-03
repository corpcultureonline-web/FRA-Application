import { eventContext, logOrderEvent } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { sentReport } from "@/lib/report/store";

const SECTION = /^(0[1-9]|10)$/;
/** A section read for longer than this is a tab left open, not reading. */
const MAX_VISIBLE_MS = 6 * 60 * 60 * 1000;

/**
 * The Report page's reading events (Event-Log-Spec §4.3b), sent by beacon:
 * report_section_read with the time a section was on screen. The order comes from the token,
 * never from the browser. Answers 204 whatever happens.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/runs/[token]/report-event">) {
  const { token } = await ctx.params;
  try {
    const body = JSON.parse(await request.text()) as { type?: unknown; sections?: unknown };
    const report = await sentReport(token);
    if (typeof report === "string") return new Response(null, { status: 204 });
    const context = eventContext(request.headers);
    const { orderId, auditId } = report;

    // The Roadmap button has its own route now, which records the interest itself (T127).
    if (body.type === "sections" && body.sections && typeof body.sections === "object") {
      const present = new Set(report.document.contents.map((c) => c.number));
      for (const [section, ms] of Object.entries(body.sections as Record<string, unknown>)) {
        if (!SECTION.test(section) || !present.has(section) || typeof ms !== "number" || !(ms > 0)) continue;
        await logOrderEvent(
          context,
          "report_section_read",
          { order_id: orderId, section, ms_visible: Math.min(Math.round(ms), MAX_VISIBLE_MS) },
          orderId,
          auditId,
        );
      }
    }
  } catch (error) {
    reportError("Report event failed", error);
  }
  return new Response(null, { status: 204 });
}
