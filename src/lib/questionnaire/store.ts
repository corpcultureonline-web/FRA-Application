import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";
import { logOrderEvent, type EventContext } from "@/lib/events/server";
import { paidRun, type PaidRun } from "@/lib/payments/orders";
import { isAnswered, type Answer, type Answers, type ContradictionPair } from "./rules";
import { brandProfile, buildQuestionnaire, forBrand, type BrandProfile, type Questionnaire } from "./source";

/**
 * The Report questionnaire's server side: one paid order's answers, saved on
 * every answer (T32) and submitted once (T72). Every write checks the answer
 * against the same rules the screen uses, so the browser decides nothing.
 */

const CONTENT = path.join(process.cwd(), "src", "content", "tier2");
let cached: Questionnaire | undefined;

export function getQuestionnaire(): Questionnaire {
  if (cached) return cached;
  const read = (file: string) => readFileSync(path.join(CONTENT, file), "utf8");
  cached = buildQuestionnaire({
    strings: read("Tier2-Questionnaire-Strings.md"),
    structure: JSON.parse(read("questions.json")),
    fieldHelp: read("Content-Library-Tier2-Field-Help.md"),
    questionnaireLibrary: read("Content-Library-Tier2-Questionnaire.md"),
  });
  return cached;
}

/** A run's own questions: 32 for a single-outlet brand, 34 for more (Strings v1.2). */
export function questionnaireFor(run: Pick<Run, "brand">): Questionnaire {
  return forBrand(getQuestionnaire(), run.brand);
}

export type Run = PaidRun & {
  /** What the brand's question set depends on, from its Audit profile. */
  brand: BrandProfile;
  answers: Answers;
  /** Pairs he was shown and confirmed ("proceeded"), so they are not raised again. */
  confirmed: ContradictionPair[];
  startedAt: Date | null;
  submittedAt: Date | null;
  /** His UE02 answer in the Audit, for the margin check (T45). */
  auditMargin: string | null;
};

export async function loadRun(token: string): Promise<Run | null> {
  const run = await paidRun(token);
  if (!run) return null;
  const db = getDatabase();
  const [[order], answerRows, contradictionRows, marginRows] = await Promise.all([
    db.query<RowDataPacket[]>("SELECT questions_started_at, submitted_at FROM report_orders WHERE id = ?", [run.orderId]).then(([r]) => r),
    db
      .query<RowDataPacket[]>(
        "SELECT question_code, option_index, number_value, escape_kind, computed FROM report_answers WHERE order_id = ?",
        [run.orderId],
      )
      .then(([r]) => r),
    db
      .query<RowDataPacket[]>("SELECT pair_code FROM report_contradictions WHERE order_id = ? AND outcome = 'proceeded'", [run.orderId])
      .then(([r]) => r),
    db
      .query<RowDataPacket[]>(
        `SELECT s.outlets, a.answer_label FROM audit_submissions s
           LEFT JOIN audit_answers a ON a.submission_id = s.id AND a.question_code = 'UE02'
          WHERE s.id = ?`,
        [run.auditId],
      )
      .then(([r]) => r),
  ]);

  const answers: Answers = {};
  for (const row of answerRows) {
    answers[row.question_code] = {
      option: row.option_index === null ? null : Number(row.option_index),
      number: row.number_value === null ? null : Number(row.number_value),
      escape: row.escape_kind,
      computed: Boolean(row.computed),
    };
  }
  return {
    ...run,
    brand: brandProfile(String(marginRows[0]?.outlets ?? "1")),
    answers,
    confirmed: contradictionRows.map((row) => row.pair_code as ContradictionPair),
    startedAt: order?.questions_started_at ?? null,
    submittedAt: order?.submitted_at ?? null,
    auditMargin: (marginRows[0]?.answer_label as string | undefined) ?? null,
  };
}

/** The same run, found by its order: for work that starts from the order, such as freezing the Report. */
export async function loadRunByOrder(orderId: number): Promise<Run | null> {
  const [rows] = await getDatabase().query<RowDataPacket[]>("SELECT token FROM report_orders WHERE id = ? AND status = 'paid'", [orderId]);
  return rows[0]?.token ? loadRun(rows[0].token) : null;
}

export type SaveMeta = { helpOpened: boolean; msSincePrevious: number | null };

export class SubmittedError extends Error {}

/** Answer text for the event log: the option's words, the figure, or the escape. Never personal data. */
function answerLabel(questionnaire: Questionnaire, code: string, answer: Answer) {
  // Every question, asked of this brand or not: labels an answer saved before a profile changed.
  const question = questionnaire.questions.find((q) => q.code === code)!;
  if (answer.escape) return question.escape!.label;
  if (answer.number !== null) return `${answer.number}${question.input?.suffix === "%" ? "%" : ""}`;
  return question.options[answer.option!];
}

/**
 * Saves one answer, after checking it against the question. Writes
 * question_answered, or answer_changed when it replaces a different answer.
 * Refuses once the questionnaire is submitted: the refund boundary has passed
 * and the answers are what Ronak reviews (T72).
 */
export async function saveAnswer(context: EventContext, run: Run, code: string, answer: Answer, meta: SaveMeta) {
  if (run.submittedAt) throw new SubmittedError();
  const questionnaire = getQuestionnaire();
  // Only the brand's own questions take answers: no OR6 for a single-outlet brand, one of PP6a/PP6b.
  const question = questionnaireFor(run).questions.find((q) => q.code === code);
  if (!question || !isAnswered(question, answer)) return false;

  const clean: Answer = {
    option: answer.escape || question.type === "num" ? null : answer.option,
    number: answer.escape || question.type !== "num" ? null : answer.number,
    escape: answer.escape,
    computed: code === "UE7" && !answer.escape && answer.computed,
  };
  const db = getDatabase();
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE report_orders SET questions_started_at = COALESCE(questions_started_at, CURRENT_TIMESTAMP(3))
      WHERE id = ? AND submitted_at IS NULL`,
    [run.orderId],
  );
  if (!result.affectedRows) throw new SubmittedError();
  await db.execute(
    `INSERT INTO report_answers (order_id, question_code, option_index, number_value, escape_kind, computed)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE option_index = VALUES(option_index), number_value = VALUES(number_value),
       escape_kind = VALUES(escape_kind), computed = VALUES(computed)`,
    [run.orderId, code, clean.option, clean.number, clean.escape, clean.computed],
  );

  const previous = run.answers[code];
  const label = answerLabel(questionnaire, code, clean);
  const value = clean.option !== null ? clean.option + 1 : clean.number;
  if (previous && isAnswered(question, previous)) {
    const before = answerLabel(questionnaire, code, previous);
    if (before !== label) {
      await logOrderEvent(
        context,
        "answer_changed",
        {
          code,
          from_value: previous.option !== null ? previous.option + 1 : previous.number,
          to_value: value,
          from_label: before,
          to_label: label,
        },
        run.orderId,
        run.auditId,
      );
    }
  } else {
    await logOrderEvent(
      context,
      "question_answered",
      {
        code,
        section: question.section,
        seq: question.seq,
        value,
        label,
        escape: clean.escape,
        computed: clean.computed,
        help_opened: meta.helpOpened,
        ms_since_previous: meta.msSincePrevious,
        variant: "default",
      },
      run.orderId,
      run.auditId,
    );
  }
  return true;
}

/** A contradiction warning shown, and what he did about it (Event-Log-Spec, contradiction_warned). */
export async function recordContradiction(
  context: EventContext,
  run: Run,
  pair: ContradictionPair,
  outcome: "proceeded" | "amended",
  values: (number | null)[],
  msShown: number | null,
) {
  if (run.submittedAt) throw new SubmittedError();
  await getDatabase().execute(
    `INSERT INTO report_contradictions (order_id, pair_code, outcome) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE outcome = VALUES(outcome)`,
    [run.orderId, pair, outcome],
  );
  await logOrderEvent(context, "contradiction_warned", { pair, values, outcome, ms_shown: msShown }, run.orderId, run.auditId);
}

/** The codes still unanswered, in questionnaire order. */
export function unanswered(run: Pick<Run, "answers" | "brand">) {
  return questionnaireFor(run)
    .questions.filter((question) => !isAnswered(question, run.answers[question.code]))
    .map((question) => question.code);
}

/**
 * Finish and send: the refund boundary (T72). Written once, only when every
 * question has an answer (T43); a second tap changes nothing.
 */
export async function submit(context: EventContext, run: Run, msTotal: number | null) {
  const missing = unanswered(run);
  if (missing.length) return { ok: false as const, missing };
  const [result] = await getDatabase().execute<ResultSetHeader>(
    "UPDATE report_orders SET submitted_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND submitted_at IS NULL",
    [run.orderId],
  );
  if (result.affectedRows) {
    const escapes = Object.values(run.answers).filter((answer) => answer?.escape).length;
    await logOrderEvent(
      context,
      "questionnaire_submitted",
      {
        order_id: run.orderId,
        answered: questionnaireFor(run).questions.length,
        ms_total: msTotal,
        escapes_used: escapes,
        contradictions_confirmed: run.confirmed.length,
      },
      run.orderId,
      run.auditId,
    );
  }
  /** `submitted` is true only for the tap that crossed the boundary. */
  return { ok: true as const, submitted: result.affectedRows > 0 };
}

/** help_page_opened (Event-Log-Spec): which question sent him to the help page. */
export async function recordHelpOpened(context: EventContext, run: Run, fromCode: string, section: number) {
  await logOrderEvent(context, "help_page_opened", { from_code: fromCode, section }, run.orderId, run.auditId);
}
