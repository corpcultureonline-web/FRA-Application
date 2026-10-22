import { after, NextResponse } from "next/server";
import { withBasePath } from "@/lib/base-path";
import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { loadRun, submit } from "@/lib/questionnaire/store";
import { freezeReport } from "@/lib/report/store";

/**
 * Finish and send, from the review screen (T51). The refund boundary (T72):
 * every answer must be saved first (T43), and it is recorded once. Returns
 * where the founder goes next — his personal link, which then shows Screen 5.
 * The Report is assembled and frozen once, after the response (Report §2).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/runs/[token]/submit">) {
  const { token } = await ctx.params;
  let msTotal: number | null = null;
  try {
    const body = (await request.json()) as { ms_total?: unknown };
    if (typeof body.ms_total === "number") msTotal = Math.round(body.ms_total);
  } catch {
    // An empty body is fine: ms_total is only telemetry.
  }

  try {
    const run = await loadRun(token);
    if (!run) return NextResponse.json({ error: "run" }, { status: 404 });
    const result = await submit(eventContext(request.headers), run, msTotal);
    if (!result.ok) return NextResponse.json({ error: "incomplete", missing: result.missing }, { status: 409 });
    if (result.submitted) {
      const events = eventContext(request.headers);
      after(() => freezeReport(run.orderId, events).catch((error) => reportError("Report assembly failed", error, { order_id: run.orderId })));
    }
    return NextResponse.json({ next: withBasePath(`/report/my/${token}?from=finish`) });
  } catch (error) {
    reportError("Questionnaire submit failed", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
