import { NextResponse } from "next/server";
import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { contradictions, type ContradictionPair } from "@/lib/questionnaire/rules";
import { getQuestionnaire, loadRun, recordContradiction, SubmittedError } from "@/lib/questionnaire/store";

const PAIRS = new Set<ContradictionPair>(["FL4_FL5", "UE8_UE7", "BP3_BP4", "UE7_UE02"]);

/**
 * A contradiction warning's outcome: "proceeded" (It's correct, continue) or
 * "amended" (he changed an answer and the pair no longer holds). A proceeded
 * pair is only recorded if the saved answers really do form it.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/runs/[token]/contradiction">) {
  const { token } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const pair = body.pair as ContradictionPair;
  const outcome = body.outcome;
  if (!PAIRS.has(pair) || (outcome !== "proceeded" && outcome !== "amended")) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const run = await loadRun(token);
    if (!run) return new NextResponse(null, { status: 404 });
    const live = contradictions(getQuestionnaire().questions, run.answers, run.auditMargin).find((c) => c.pair === pair);
    if (outcome === "proceeded" && !live) return new NextResponse(null, { status: 409 });
    const msShown = typeof body.ms_shown === "number" ? Math.round(body.ms_shown) : null;
    await recordContradiction(eventContext(request.headers), run, pair, outcome, live?.values ?? [], msShown);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SubmittedError) return new NextResponse(null, { status: 409 });
    reportError("Contradiction record failed", error);
    return new NextResponse(null, { status: 500 });
  }
}
