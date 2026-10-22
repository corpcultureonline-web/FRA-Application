import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { getQuestionnaire, loadRun, recordHelpOpened } from "@/lib/questionnaire/store";

/**
 * help_page_opened: sent by beacon as the help page opens in a new tab, naming
 * the question on screen. Answers 204 whatever happens — telemetry must never
 * surface to a founder mid-questionnaire (Event-Log-Spec §3).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/runs/[token]/help">) {
  const { token } = await ctx.params;
  try {
    const body = JSON.parse(await request.text()) as { from_code?: unknown };
    const question = getQuestionnaire().questions.find((q) => q.code === body.from_code);
    const run = question ? await loadRun(token) : null;
    if (run && question) await recordHelpOpened(eventContext(request.headers), run, question.code, question.section);
  } catch (error) {
    reportError("Help page event failed", error);
  }
  return new Response(null, { status: 204 });
}
