import { NextResponse } from "next/server";
import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import type { Answer } from "@/lib/questionnaire/rules";
import { loadRun, saveAnswer, SubmittedError } from "@/lib/questionnaire/store";

const ESCAPES = new Set(["not_applicable", "dont_know", "prefer_not"]);

/**
 * Saves one answer on a paid run (T32: server-side, on every answer). The
 * personal-link token identifies the order; the answer is checked against the
 * question before it is stored. 204 on success; 409 once submitted.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/runs/[token]/answers">) {
  const { token } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code : "";
  const answer: Answer = {
    option: typeof body.option === "number" ? body.option : null,
    number: typeof body.number === "number" ? body.number : null,
    escape: typeof body.escape === "string" && ESCAPES.has(body.escape) ? (body.escape as Answer["escape"]) : null,
    computed: body.computed === true,
  };

  try {
    const run = await loadRun(token);
    if (!run) return NextResponse.json({ error: "run" }, { status: 404 });
    const saved = await saveAnswer(eventContext(request.headers), run, code, answer, {
      helpOpened: body.help_opened === true,
      msSincePrevious: typeof body.ms_since_previous === "number" ? Math.round(body.ms_since_previous) : null,
    });
    if (!saved) return NextResponse.json({ error: "invalid" }, { status: 400 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SubmittedError) return NextResponse.json({ error: "submitted" }, { status: 409 });
    reportError("Report answer save failed", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
