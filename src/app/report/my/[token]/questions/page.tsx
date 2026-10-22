import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isAnswered } from "@/lib/questionnaire/rules";
import { loadRun, questionnaireFor } from "@/lib/questionnaire/store";
import { TIERS } from "@/lib/pricing";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { Questionnaire, type QuestionnaireCopy } from "./Questionnaire";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: TIERS.report.name };

const KEYS = [
  "T2Q-PROGRESS", "T2Q-SAVED", "T2Q-BACK", "T2Q-NEXT", "T2Q-FINISH", "T2Q-LEGAL-NOTE", "T2Q-RESUME-NOTE",
  "T2Q-SAVEFAIL", "T2Q-HELP-LINK", "T2Q-ANCHOR-NOTE", "T2Q-ANCHOR-NOTE-FL2", "T2Q-REMAIN", "T2Q-REMAIN-ONE",
  "T2Q-ALLSET", "T2Q-REVIEW-HEAD", "T2Q-REVIEW-SUB", "T2Q-REVIEW-EDIT", "T2Q-REVIEW-BACK", "T2Q-HELP-A11Y",
  "T2H-UE7-CALC-LINK", "T2H-UE7-CALC-REV", "T2H-UE7-CALC-COST", "T2H-UE7-CALC-COST-NOTE", "T2H-UE7-CALC-RESULT",
  "T2V-CONTRADICT", "T2V-CONTRADICT-GO", "T2V-CONTRA-FL", "T2V-CONTRA-UE", "T2V-CONTRA-BP", "T2V-CONTRA-MARGIN",
  "T2C-ENTITY",
] as const;

/**
 * Screen 4, the questionnaire (Questionnaire v1.2, Field Help v1.5). Lands on
 * the sub-screen asked for (?s=), else the first with a question unanswered,
 * else the review screen — so a resume link returns him to the question he
 * left (T32). Once submitted, the questions are closed (T72).
 */
export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const run = await loadRun(token);
  if (!run) notFound();
  if (run.submittedAt) redirect(`/report/my/${token}`);

  // His own set: 32 questions for one outlet, 34 for more (Strings v1.2).
  const questionnaire = questionnaireFor(run);
  const byCode = new Map(questionnaire.questions.map((q) => [q.code, q]));
  const firstOpen = questionnaire.screens.findIndex((screen) =>
    screen.codes.some((code) => !isAnswered(byCode.get(code)!, run.answers[code])),
  );
  const asked = Number(query.s);
  const start =
    query.s === "review" ? "review" : Number.isInteger(asked) && asked >= 0 && asked < questionnaire.screens.length ? asked : firstOpen === -1 ? "review" : firstOpen;

  const copy = Object.fromEntries(KEYS.map((key) => [key, t2(key)])) as QuestionnaireCopy;
  const help = Object.fromEntries(
    questionnaire.questions.filter((q) => q.helpKey).map((q) => [q.code, plain(t2(q.helpKey!))]),
  );

  return (
    <Questionnaire
      token={token}
      questionnaire={questionnaire}
      initialAnswers={run.answers}
      confirmed={run.confirmed}
      auditMargin={run.auditMargin}
      start={start}
      copy={copy}
      help={help}
      belowNotes={Object.fromEntries(
        questionnaire.questions.filter((q) => q.input?.belowRange).map((q) => [q.code, plain(t2(q.input!.belowRange!))]),
      )}
    />
  );
}
