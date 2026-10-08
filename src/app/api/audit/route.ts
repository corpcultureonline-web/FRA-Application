import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";
import { EMPTY_PROFILE, profileProblems, type Profile } from "@/lib/audit";
import { getDatabase } from "@/lib/db";
import { reportError } from "@/lib/monitoring/report-error";
import { getSiteOrigin, newReportToken, reportPdfUrl } from "@/lib/report";
import { getScoringConfig } from "@/lib/scoring/config";
import {
  overallForStorage,
  pillarScoreForStorage,
  score,
  type AnswerMap,
  type ScoringConfig,
} from "@/lib/scoring/engine";
import { toPublicScore } from "@/lib/scoring/public";
import { createFraSubmission, fraResult, isZohoConfigured } from "@/lib/crm/adapter";

type Body = { profile?: unknown; answers?: unknown };

function readProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const profile = { ...EMPTY_PROFILE };
  for (const key of Object.keys(EMPTY_PROFILE) as (keyof Profile)[]) {
    if (typeof raw[key] !== "string") return null;
    profile[key] = (raw[key] as string).trim();
  }
  return profileProblems(profile).length === 0 ? profile : null;
}

/**
 * Every question on the screens is required, so every answer must be one of
 * the seeded options. Unknown question codes are dropped.
 */
function readAnswers(config: ScoringConfig, value: unknown): AnswerMap | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const answers: AnswerMap = {};
  for (const question of config.questions) {
    const answer = raw[question.code];
    if (typeof answer !== "string" || !question.options.some((o) => o.label === answer)) {
      return null;
    }
    answers[question.code] = answer;
  }
  return answers;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const profile = readProfile(body.profile);
  if (!profile) {
    return NextResponse.json(
      { error: "Some details in “About your business” are missing. Please go back and check." },
      { status: 400 },
    );
  }

  let config: ScoringConfig;
  try {
    config = await getScoringConfig();
  } catch (error) {
    reportError("Scoring config unavailable", error);
    return NextResponse.json(
      { error: "Your answers could not be scored right now. Please try again later." },
      { status: 500 },
    );
  }

  const answers = readAnswers(config, body.answers);
  if (!answers) {
    return NextResponse.json(
      { error: "Some questions are unanswered. Please go back and check." },
      { status: 400 },
    );
  }

  // The full result (with the overall score) stays on the server.
  const result = score(config, answers);
  const reportToken = newReportToken();

  const db = await getDatabase().getConnection();
  let id: number;
  try {
    await db.beginTransaction();
    const [inserted] = await db.execute<ResultSetHeader>(
      `INSERT INTO audit_submissions
         (brand_name, founder_name, email, category, outlets, city, scoring_version,
          overall_score, range_low, range_high, score_band, band, gate, weakest_pillar, report_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.brandName,
        profile.founderName,
        profile.email,
        profile.category,
        profile.outlets,
        profile.city,
        result.configVersion,
        overallForStorage(result),
        result.range.low,
        result.range.high,
        result.scoreBand,
        result.band,
        result.gate,
        result.weakest,
        reportToken,
      ],
    );
    id = inserted.insertId;

    for (const question of config.questions) {
      const label = answers[question.code] ?? null;
      const value = question.options.find((o) => o.label === label)?.value ?? null;
      await db.execute(
        "INSERT INTO audit_answers (submission_id, question_code, answer_label, answer_value) VALUES (?, ?, ?, ?)",
        [id, question.code, label, value],
      );
    }
    for (const pillar of result.pillars) {
      await db.execute(
        "INSERT INTO audit_pillar_scores (submission_id, pillar_code, score, status) VALUES (?, ?, ?, ?)",
        [id, pillar.code, pillarScoreForStorage(pillar), pillar.status],
      );
    }
    await db.commit();
  } catch (error) {
    await db.rollback().catch(() => {});
    reportError("Audit submission insert failed", error);
    return NextResponse.json(
      { error: "Your answers could not be saved. Please try again later." },
      { status: 500 },
    );
  } finally {
    db.release();
  }

  // Everything below leaves the server, so it is built from the public score only.
  const publicScore = toPublicScore(config, result);
  const reportUrl = reportPdfUrl(getSiteOrigin(request), reportToken);

  // CRM delivery is best effort: the submission is already saved.
  if (isZohoConfigured()) {
    try {
      const { duplicate, id: zohoId } = await createFraSubmission({
        brandName: profile.brandName,
        founderName: profile.founderName,
        email: profile.email,
        result: fraResult(publicScore, reportUrl),
      });
      console.info(
        duplicate
          ? `Zoho FRA submission already exists (${zohoId})`
          : `Zoho FRA submission created (${zohoId})`,
      );
      // Kept so "Get my full report" can update this record later.
      if (zohoId) {
        await getDatabase()
          .execute("UPDATE audit_submissions SET zoho_record_id = ? WHERE id = ?", [zohoId, id])
          .catch((error) => reportError("Saving the Zoho record id failed", error, { submission_id: id }));
      }
    } catch (error) {
      reportError("Zoho FRA submission creation failed", error, { submission_id: id });
    }
  } else {
    console.warn("Zoho CRM credentials are not configured, skipping CRM submission.");
  }

  return NextResponse.json(
    { success: true, id, score: publicScore, reportToken, reportUrl },
    { status: 201 },
  );
}
