import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDatabase } from "@/lib/db";
import { logOrderEvent, type EventContext } from "@/lib/events/server";
import { isReportToken } from "@/lib/report";
import { payableLabel, priceLabel } from "@/lib/pricing";
import { loadRunByOrder, questionnaireFor } from "@/lib/questionnaire/store";
import { getScoringConfigVersion } from "@/lib/scoring/config";
import type { AnswerMap } from "@/lib/scoring/engine";
import { toFixed } from "@/lib/scoring/rational";
import { assembleReport, REPORT_SCHEMA, type ReportDocument } from "./assemble";
import { buildContent, CONTENT_FILES, parseDetectorConditions, type ContentFiles, type ReportContent } from "./content";
import { parsePoints, scoreReport, withDerived, type PointsRule, type ReportScore } from "./engine";

/**
 * The Report's server side: score and assemble an order's answers once, at
 * submission, and keep the result (migration 011). Everything after reads the
 * stored document; nothing re-assembles it (Report library §2, T70).
 */

const CONTENT = path.join(process.cwd(), "src", "content", "tier2");
const read = (file: string) => readFileSync(path.join(CONTENT, file), "utf8");

let cachedPoints: Map<string, PointsRule> | undefined;
const scoringPoints = () => (cachedPoints ??= parsePoints(read("Tier2-Questionnaire-Strings.md")));

const contentCache = new Map<string, ReportContent>();
function reportContent(pillars: { code: string; name: string }[]) {
  const cacheKey = pillars.map((p) => `${p.code}=${p.name}`).join("|");
  let content = contentCache.get(cacheKey);
  if (!content) {
    const files = Object.fromEntries(Object.entries(CONTENT_FILES).map(([name, file]) => [name, read(file)])) as ContentFiles;
    content = buildContent(files, pillars);
    contentCache.set(cacheKey, content);
  }
  return content;
}

/** Scores and assembles the Report for a submitted order. Pure apart from the reads. */
export async function assembleForOrder(orderId: number, now = new Date()): Promise<{ document: ReportDocument; score: ReportScore }> {
  const run = await loadRunByOrder(orderId);
  if (!run?.submittedAt) throw new Error(`Order ${orderId} has not been submitted.`);
  const db = getDatabase();
  const [[submissions], [auditRows]] = await Promise.all([
    db.query<RowDataPacket[]>(
      "SELECT brand_name, category, outlets, city, range_low, range_high, scoring_version FROM audit_submissions WHERE id = ?",
      [run.auditId],
    ),
    db.query<RowDataPacket[]>("SELECT question_code, answer_label FROM audit_answers WHERE submission_id = ?", [run.auditId]),
  ]);
  const submission = submissions[0];
  if (!submission) throw new Error(`Audit ${run.auditId} not found for order ${orderId}.`);

  // Score with the config the Audit was scored with, so the two instruments share one rulebook.
  const config = await getScoringConfigVersion(submission.scoring_version);
  const audit: AnswerMap = Object.fromEntries(auditRows.map((row) => [row.question_code, row.answer_label]));
  const points = scoringPoints();
  // A single-outlet brand's MR5 is not asked but scores as 1 (build spec §2.2); OR6 stays null.
  const answers = withDerived(run.answers, run.brand);
  const score = scoreReport({ config, audit, answers, points });
  const document = assembleReport({
    config,
    content: reportContent(config.pillars),
    questions: questionnaireFor(run).questions,
    points,
    score,
    audit,
    answers,
    profile: {
      brand: submission.brand_name,
      category: submission.category,
      outlets: submission.outlets,
      city: submission.city,
      rangeLow: Number(submission.range_low),
      rangeHigh: Number(submission.range_high),
    },
    price: { headline: priceLabel("roadmap"), payable: payableLabel("roadmap") },
    now,
  });
  return { document, score };
}

/**
 * Freezes the order's Report: assembled once and stored. A second call keeps
 * the first document — the Report a founder was promised does not move.
 */
export async function freezeReport(orderId: number, context: EventContext): Promise<void> {
  const existing = await storedReport(orderId);
  if (existing) return;
  const { document, score } = await assembleForOrder(orderId);
  const [result] = await getDatabase().execute<ResultSetHeader>(
    `INSERT IGNORE INTO report_documents (order_id, schema_version, config_version, overall_score, band, content)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orderId, REPORT_SCHEMA, document.configVersion, toFixed(score.overall, 2), score.band, JSON.stringify(document)],
  );
  if (result.affectedRows) {
    await logOrderEvent(context, "report_generated", { order_id: orderId, score: toFixed(score.overall, 2), band: score.band }, orderId);
  }
}

export async function storedReport(orderId: number): Promise<ReportDocument | null> {
  const [rows] = await getDatabase().query<RowDataPacket[]>("SELECT content FROM report_documents WHERE order_id = ?", [orderId]);
  if (!rows.length) return null;
  const raw = rows[0].content;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as ReportDocument;
}

export type SentReport = {
  orderId: number;
  auditId: number;
  sentAt: Date;
  document: ReportDocument;
  /** "Tell me about the Roadmap" already pressed (T127): Section 10 opens on "You're on the list". */
  roadmapInterestAt: Date | null;
};

/**
 * The Report behind a personal link, once it has been approved and sent
 * (Screens 8–9 set report_sent_at). "unknown" for a token we never issued;
 * "pending" for a real order whose Report has not reached the founder.
 */
export async function sentReport(token: string): Promise<SentReport | "unknown" | "pending"> {
  if (!isReportToken(token)) return "unknown";
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    // T70: the approved version, with the reviewer's edits, is the one the founder reads.
    `SELECT o.id, o.audit_submission_id, o.report_sent_at, o.roadmap_interest_at, COALESCE(d.approved_content, d.content) AS content
       FROM report_orders o LEFT JOIN report_documents d ON d.order_id = o.id
      WHERE o.token = ? AND o.status = 'paid' LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return "unknown";
  if (!row.report_sent_at || !row.content) return "pending";
  return {
    orderId: row.id,
    auditId: row.audit_submission_id,
    sentAt: row.report_sent_at,
    roadmapInterestAt: row.roadmap_interest_at ?? null,
    document: (typeof row.content === "string" ? JSON.parse(row.content) : row.content) as ReportDocument,
  };
}

/** report_opened (§4.3b): visit_n counts this order's earlier opens, so a fourth reading says 4. */
export async function recordReportOpened(context: EventContext, report: SentReport, channel: "email" | "whatsapp" | null) {
  const db = getDatabase();
  if (channel) await logOrderEvent(context, "report_link_clicked", { order_id: report.orderId, channel }, report.orderId, report.auditId);
  const [[count]] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM event_log WHERE order_id = ? AND event_type = 'report_opened'",
    [report.orderId],
  );
  await logOrderEvent(
    context,
    "report_opened",
    { order_id: report.orderId, visit_n: Number(count.n) + 1, ms_since_sent: Date.now() - new Date(report.sentAt).getTime() },
    report.orderId,
    report.auditId,
  );
}

let cachedConditions: Map<string, string> | undefined;
/** Group I §1.1's "Fires when" column, for the review panel. */
export function detectorConditions() {
  return (cachedConditions ??= parseDetectorConditions(read(CONTENT_FILES.groupI)));
}
