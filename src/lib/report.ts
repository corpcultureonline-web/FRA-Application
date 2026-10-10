import "server-only";
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { withBasePath } from "@/lib/base-path";
import { normaliseOrigin } from "@/lib/origin";
import { getDatabase } from "@/lib/db";
import { getContentPieces } from "@/lib/content/store";
import { buildReport, type ReportData } from "@/lib/result";
import { getScoringConfig, getScoringConfigVersion } from "@/lib/scoring/config";
import type { AnswerMap } from "@/lib/scoring/engine";

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
  return originFromHeaders(request.headers) ?? new URL(request.url).origin;
}

/** Same as getSiteOrigin, for pages (pass `await headers()`). */
export function originFromHeaders(headers: Headers) {
  // Forgives a SITE_URL typed without https:// or with a path (origin.ts).
  const configured = normaliseOrigin(process.env.SITE_URL);
  if (configured) return configured;

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "https";
  return host ? `${proto}://${host}` : null;
}

export function reportPdfUrl(origin: string, token: string) {
  return `${origin}${withBasePath(`/api/report/${token}`)}`;
}

type SubmissionRow = RowDataPacket & {
  id: number;
  brand_name: string;
  founder_name: string;
  email: string;
  category: string;
  outlets: string;
  city: string;
  scoring_version: string;
  phone_given: number;
  report_interest_at: Date | null;
  created_at: Date;
};

/**
 * The result for a submission, rebuilt from MySQL — the same data for the
 * result page and the PDF. See buildReport for the rules.
 */
export async function loadReport(token: string): Promise<ReportData | null> {
  if (!isReportToken(token)) return null;
  const db = getDatabase();

  const [rows] = await db.query<SubmissionRow[]>(
    `SELECT id, brand_name, founder_name, email, category, outlets, city, scoring_version,
            phone IS NOT NULL AS phone_given, report_interest_at, created_at
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

  const [config, activeConfig, pieces] = await Promise.all([
    getScoringConfigVersion(row.scoring_version),
    getScoringConfig(),
    getContentPieces(),
  ]);

  return buildReport({
    token,
    profile: {
      brandName: row.brand_name,
      founderName: row.founder_name,
      email: row.email,
      category: row.category,
      outlets: row.outlets,
      city: row.city,
    },
    answers,
    submittedAt: new Date(row.created_at),
    config,
    activeConfig,
    pieces,
    interested: row.report_interest_at !== null,
    phoneGiven: Boolean(row.phone_given),
  });
}

/**
 * Whether a submission exists for the token — checked before starting
 * Chromium, and for attributing result and PDF events to the submission.
 */
export async function reportExists(token: string) {
  if (!isReportToken(token)) return false;
  const [rows] = await getDatabase().query<RowDataPacket[]>(
    "SELECT id, brand_name FROM audit_submissions WHERE report_token = ? LIMIT 1",
    [token],
  );
  return rows[0] ? { id: rows[0].id as number, brandName: rows[0].brand_name as string } : false;
}
