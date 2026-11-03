import { after, NextResponse } from "next/server";
import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { pushRoadmapInterest, registerRoadmapInterest } from "@/lib/report/roadmap-interest";
import { sentReport } from "@/lib/report/store";

/**
 * "Tell me about the Roadmap" (T127): saves the interest against the order and
 * answers once it is saved, so the page shows "You're on the list" only when
 * it is true. The Zoho push follows after the response.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/runs/[token]/roadmap-interest">) {
  const { token } = await ctx.params;
  try {
    const report = await sentReport(token);
    if (typeof report === "string") return NextResponse.json({ error: "report" }, { status: 404 });
    const context = eventContext(request.headers);
    const at = await registerRoadmapInterest(context, report.orderId, report.auditId);
    after(() => pushRoadmapInterest(context, report.auditId, at));
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportError("Roadmap interest failed", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
