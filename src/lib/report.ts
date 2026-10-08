import "server-only";
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getDatabase } from "@/lib/db";
import { buildFacts } from "@/lib/content/facts";
import { selectContent } from "@/lib/content/select";
import { getContentPieces } from "@/lib/content/store";
import { buildReportData, type ReportData } from "@/lib/result";
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
  return originFromHeaders(request.headers) ?? new URL(request.url).origin;
}

/** Same as getSiteOrigin, for pages (pass `await headers()`). */
export function originFromHeaders(headers: Headers) {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "https";
  return host ? `${proto}://${host}` : null;
}

export function reportPdfUrl(origin: string, token: string) {
  return `${origin}/api/report/${token}`;
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
  report_interest_at: Date | null;
  created_at: Date;
};

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"];

function listText(items: string[]) {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/**
 * Rebuilds the result for a submission from MySQL: the stored answers are
 * re-scored with the config version they were scored with, content pieces are
 * selected by trigger, and only public values reach the page — the same data
 * for the result page and the PDF.
 */
export async function loadReport(token: string): Promise<ReportData | null> {
  if (!isReportToken(token)) return null;
  const db = getDatabase();

  const [rows] = await db.query<SubmissionRow[]>(
    `SELECT id, brand_name, founder_name, email, category, outlets, city, scoring_version,
            report_interest_at, created_at
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

  const profile = {
    brandName: row.brand_name,
    founderName: row.founder_name,
    email: row.email,
    category: row.category,
    outlets: row.outlets,
    city: row.city,
  };
  const [config, pieces] = await Promise.all([
    getScoringConfigVersion(row.scoring_version),
    getContentPieces(),
  ]);
  const result = score(config, answers);
  const publicScore = toPublicScore(config, result);
  const facts = buildFacts(config, answers, profile, result);

  const areaName = (code: string | null) => publicScore.areas.find((a) => a.code === code)?.name;
  const weak = publicScore.areas.filter((a) => a.status === "Weak").map((a) => a.name);
  const content = selectContent(pieces, facts, {
    brand: profile.brandName,
    outlets: profile.outlets,
    city: profile.city,
    low: String(publicScore.range.low),
    high: String(publicScore.range.high),
    band: publicScore.band.name,
    weakest_area: areaName(publicScore.weakest),
    weak_count: NUMBER_WORDS[weak.length] ?? String(weak.length),
    weak_list: listText(weak) || undefined,
  });

  return buildReportData({
    token,
    profile,
    answers: answers as Record<string, string>,
    score: publicScore,
    submittedAt: new Date(row.created_at),
    content,
    interested: row.report_interest_at !== null,
  });
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
