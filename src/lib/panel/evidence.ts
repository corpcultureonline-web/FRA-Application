import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";
import { getQuestionnaire, loadRunByOrder, questionnaireFor } from "@/lib/questionnaire/store";
import type { ReportDocument, Section } from "@/lib/report/assemble";
import { pieces } from "@/lib/report/pieces";
import { detectorConditions } from "@/lib/report/store";
import { getScoringConfig } from "@/lib/scoring/config";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";

/**
 * The evidence beside a Report in the review panel (Admin §3): the founder's
 * answers as he gave them, why each piece fired, and the flags that need the
 * reviewer's eye. Read from the order's own records, never from the Report's
 * text, so the evidence cannot simply repeat what it is checking.
 */

type Of<N extends Section["number"]> = Extract<Section, { number: N }>;
const find = <N extends Section["number"]>(doc: ReportDocument, n: N) => doc.sections.find((s) => s.number === n) as Of<N> | undefined;

export type AnswerGroup = { section: string; rows: { code: string; stem: string; value: string; declined: boolean }[] };
/** One row of "Why each piece fired": the slot it explains, the library piece, and the rule with this brand's values. */
export type Reason = { slot: string; pieceId: string; rule: string; values: string };

export type Evidence = { answers: AnswerGroup[]; reasons: Reason[]; flags: string[] };

const CODE = /\b(UE\d+|OR\d+|SI\d+|FL\d+|MR\d+|BP\d+|PP\d+b?|G\d)\b/g;

export async function evidence(orderId: number, doc: ReportDocument, confirmedPairs: string[]): Promise<Evidence> {
  const [run, config, [auditRows]] = await Promise.all([
    loadRunByOrder(orderId),
    getScoringConfig(),
    getDatabase().query<RowDataPacket[]>(
      `SELECT aa.question_code, aa.answer_label, a.outlets FROM report_orders o
         JOIN audit_submissions a ON a.id = o.audit_submission_id
         JOIN audit_answers aa ON aa.submission_id = a.id
        WHERE o.id = ?`,
      [orderId],
    ),
  ]);
  // The brand's own questions: 32, or 34 with OR6 and MR5 for more than one outlet.
  const questionnaire = run ? questionnaireFor(run) : getQuestionnaire();
  const answers = run?.answers ?? {};
  const audit = new Map(auditRows.map((row) => [row.question_code as string, row.answer_label as string | null]));
  const outlets = (auditRows[0]?.outlets as string | undefined) ?? "";

  /** A Report answer exactly as the founder saw it (Admin §3: "I don't know my margin", not a blank). */
  const shown = (code: string): { value: string; declined: boolean } | null => {
    const question = questionnaire.questions.find((q) => q.code === code);
    const answer = answers[code];
    if (!question || !answer) return null;
    if (answer.escape) return { value: question.escape?.label ?? answer.escape, declined: true };
    if (answer.number !== null) {
      const suffix = question.input?.suffix;
      return { value: suffix === "%" ? `${answer.number}%` : suffix ? `${answer.number} ${suffix}` : String(answer.number), declined: false };
    }
    return answer.option === null ? null : { value: question.options[answer.option], declined: false };
  };
  const valueOf = (code: string) => shown(code)?.value ?? audit.get(code) ?? "—";

  // Every question this brand was asked (32 or 34), grouped by the eight sections.
  const groups: AnswerGroup[] = questionnaire.sections.map((section) => ({
    section: section.name,
    rows: questionnaire.questions
      .filter((q) => q.section === section.number)
      .map((q) => ({ code: q.code, stem: q.stem, ...(shown(q.code) ?? { value: "—", declined: false }) })),
  }));

  // Why each piece fired.
  const conditions = detectorConditions();
  const six = find(doc, "06");
  const four = find(doc, "04");
  const pillar = (code: string) => six?.pillars.find((p) => p.code === code);
  const bandName = (code: string | null) => config.bands.find((b) => b.code === code)?.displayName ?? code ?? "";
  const bandRule = (code: string | null) => {
    const i = config.bands.findIndex((b) => b.code === code);
    return i < 0 ? "" : `${bandName(code)}: ${i ? `> ${config.bands[i - 1].max}` : "≥ 0"} and ≤ ${config.bands[i].max}`;
  };
  const withValues = (rule: string) => {
    const codes = [...new Set(rule.match(CODE) ?? [])];
    const parts = codes.map((code) => `${code} = ${valueOf(code)}`);
    if (/outlets_band/.test(rule)) parts.push(`outlets = ${outlets}`);
    return parts.join(" · ");
  };
  const reasons: Reason[] = pieces(doc).map(({ slot, pieceId }) => {
    if (pieceId.startsWith("LF-")) {
      const rule = conditions.get(pieceId) ?? "";
      return { slot, pieceId, rule, values: withValues(rule) };
    }
    if (pieceId.startsWith("I-LEAD-")) {
      const top = four?.gaps[0];
      return {
        slot,
        pieceId,
        rule: conditions.get("LF-NO-CONTRADICTION") ?? "",
        values: top ? `costliest gap ${top.code} ${top.score} (${top.severity})` : "no gap above 85",
      };
    }
    if (pieceId.startsWith("C-")) {
      const p = pillar(pieceId.slice(2, 4));
      return { slot, pieceId, rule: bandRule(p?.band ?? null), values: p ? `${p.name} ${p.score}` : "" };
    }
    if (pieceId.startsWith("D-")) {
      const gap = four?.gaps.find((g) => g.code === pieceId.slice(2, 4));
      return {
        slot,
        pieceId,
        rule: "weight × (100 − score), largest first",
        values: gap ? `#${gap.rank} · ${gap.weight}% × (100 − ${gap.score}) · ${gap.severity}` : "",
      };
    }
    if (pieceId.startsWith("I-NN-")) {
      const gate = pieceId.slice(5, 7);
      return { slot, pieceId, rule: `${gate} answer`, values: `${gate} = ${valueOf(gate)}` };
    }
    if (pieceId === "I-CMP") {
      return { slot, pieceId, rule: "Audit range against the final score", values: `${doc.cover.overall} · ${find(doc, "03")?.comparison.paragraphs.length ?? 0} lines` };
    }
    return { slot, pieceId, rule: "always", values: "" };
  });

  // The flags above the Report (Admin §3).
  const p = (key: string) => plain(t2(key));
  const flags: string[] = [];
  const dontKnow = Object.values(answers).filter((a) => a?.escape === "dont_know").length;
  if (dontKnow) flags.push(p("T2A-FLAG-DK").replace("{n}", String(dontKnow)));
  // T100 moved the measurement lead to three "I don't know" answers; the flag follows the Report.
  if (doc.detectors.lead === "LF-UNMEASURED") flags.push(p("T2A-FLAG-DK-LEAD"));
  for (const block of six?.pillars ?? []) if (!block.assessed) flags.push(p("T2A-FLAG-NOTASSESSED").replace("{pillar}", block.displayName));
  if (confirmedPairs.length) flags.push(p("T2A-FLAG-CONTRA").replace("{n}", String(confirmedPairs.length)));
  if (doc.detectors.fired.includes("LF-TWO-MARGINS")) flags.push(p("T2A-FLAG-MARGIN"));

  return { answers: groups, reasons, flags };
}
