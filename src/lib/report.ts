import "server-only";
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getDatabase } from "@/lib/db";
import { buildResult, type AuditResult } from "@/lib/result";
import { getScoringConfigVersion } from "@/lib/scoring/config";
import { score, type AnswerMap } from "@/lib/scoring/engine";
import { toPublicScore } from "@/lib/scoring/public";

/**
 * Each submission's results PDF lives at /api/report/<token>. The token is
 * the only key — 128 random bits, so links can't be guessed or enumerated
 * the way sequential ids could.
 */
export function newReportToken() {
  return randomBytes(16).toString("hex");
}

export function isReportToken(value: string) {
  return /^[0-9a-f]{32}$/.test(value);
}

/**
 * Public origin of the site, for links that leave the server (the Zoho email)
 * and for the page Chromium prints. SITE_URL wins; otherwise the proxy
 * headers of the current request.
 */
export function getSiteOrigin(request: Request) {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  const headers = request.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "https";
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

export function reportPdfUrl(origin: string, token: string) {
  return `${origin}/api/report/${token}`;
}

type SubmissionRow = RowDataPacket & {
  brand_name: string;
  founder_name: string;
  email: string;
  category: string;
  outlets: string;
  city: string;
  scoring_version: string;
  created_at: Date;
};

/**
 * Rebuilds the result screen for a submission from MySQL: the stored answers
 * are re-scored with the config version they were scored with, then reduced
 * to the public score — so the PDF shows exactly what the founder saw, and
 * never the overall or pillar scores.
 */
export async function loadReport(token: string): Promise<AuditResult | null> {
  if (!isReportToken(token)) return null;
  const db = getDatabase();

  const [rows] = await db.query<SubmissionRow[]>(
    `SELECT id, brand_name, founder_name, email, category, outlets, city, scoring_version, created_at
       FROM audit_submissions WHERE report_token = ? LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return null;

  const [answerRows] = await db.query<RowDataPacket[]>(
    "SELECT question_code, answer_label FROM audit_answers WHERE submission_id = ?",
    [row.id],
  );
  const answers: AnswerMap = {};
  for (const answer of answerRows) answers[answer.question_code] = answer.answer_label;

  const config = await getScoringConfigVersion(row.scoring_version);
  const publicScore = toPublicScore(config, score(config, answers));

  return buildResult(
    {
      brandName: row.brand_name,
      founderName: row.founder_name,
      email: row.email,
      category: row.category,
      outlets: row.outlets,
      city: row.city,
    },
    answers as Record<string, string>,
    publicScore,
    new Date(row.created_at),
  );
}

/** Whether a submission exists for the token — checked before starting Chromium. */
export async function reportExists(token: string) {
  if (!isReportToken(token)) return false;
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    "SELECT brand_name FROM audit_submissions WHERE report_token = ? LIMIT 1",
    [token],
  );
  return rows[0] ? { brandName: rows[0].brand_name as string } : false;
}
