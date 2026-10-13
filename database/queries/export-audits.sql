-- Audit export: one row per brand, each question's full wording as a column,
-- the chosen answer beneath it, and every code written out in plain words.
--
-- phpMyAdmin → SQL tab → paste → Go → Export (under the results) → "CSV for
-- MS Excel" or "Microsoft Excel 2007 XML". Change the date range in WHERE.
--
-- Times are stored in UTC; they are shown here in IST (+5:30).
-- overall_score is left out on purpose: it is the exact number Tier 1 never
-- shows a founder (Scoring Spec §4), so it should not travel in a spreadsheet.
-- Question wording matches src/lib/audit.ts.

SELECT
  s.id                                                    AS `Submission ID`,
  DATE_FORMAT(s.created_at + INTERVAL 330 MINUTE, '%d %b %Y, %h:%i %p') AS `Submitted (IST)`,
  s.brand_name                                            AS `Brand`,
  s.founder_name                                          AS `Founder`,
  s.email                                                 AS `Email`,
  s.phone                                                 AS `Mobile`,
  s.category                                              AS `Category`,
  s.outlets                                               AS `Outlets`,
  s.city                                                  AS `City`,
  CONCAT(s.range_low, ' – ', s.range_high)                AS `Score range`,
  CASE s.band WHEN 'B1' THEN 'Not Yet Ready' WHEN 'B2' THEN 'Early Stage'
              WHEN 'B3' THEN 'Almost Ready' WHEN 'B4' THEN 'Ready to Plan'
              WHEN 'B5' THEN 'Ready to Scale' END         AS `Readiness level`,
  CASE s.gate WHEN 'pass' THEN 'No legal issue'
              WHEN 'capped' THEN 'Capped: no trademark'
              WHEN 'hard' THEN 'Blocked: legal dispute' END AS `Legal gate`,
  CASE s.weakest_pillar WHEN 'UE' THEN 'Profit & Payback' WHEN 'OR' THEN 'Systems'
              WHEN 'SI' THEN 'Support' WHEN 'FL' THEN 'Your Role'
              WHEN 'MR' THEN 'Market Proof' WHEN 'BP' THEN 'Brand Pull'
              WHEN 'PP' THEN 'Right Partner' END           AS `Weakest area`,
  IF(s.report_interest_at IS NULL, 'No',
     DATE_FORMAT(s.report_interest_at + INTERVAL 330 MINUTE, '%d %b %Y, %h:%i %p'))
                                                          AS `Asked for full report (IST)`,
  MAX(CASE WHEN a.question_code = 'UE01' THEN a.answer_label END)
    AS `What is the typical payback period for one of your own outlets?`,
  MAX(CASE WHEN a.question_code = 'UE02' THEN a.answer_label END)
    AS `What is your outlet-level operating margin?`,
  MAX(CASE WHEN a.question_code = 'OR01' THEN a.answer_label END)
    AS `Are your operating procedures documented in writing, rather than held as knowledge by your team?`,
  MAX(CASE WHEN a.question_code = 'OR02' THEN a.answer_label END)
    AS `How many of your core workflows have a written SOP that a new manager could follow unassisted?`,
  MAX(CASE WHEN a.question_code = 'BP01' THEN a.answer_label END)
    AS `How many enquiries about franchising have you received in the last 12 months, without asking for them?`,
  MAX(CASE WHEN a.question_code = 'MR01' THEN a.answer_label END)
    AS `In how many distinct cities has your model been tested?`,
  MAX(CASE WHEN a.question_code = 'PP01' THEN a.answer_label END)
    AS `Have you defined the profile of your ideal franchise partner — the capital they need, the experience required, and how involved they should be?`,
  MAX(CASE WHEN a.question_code = 'SI01' THEN a.answer_label END)
    AS `Is there a structured training programme for a new franchisee and their staff?`,
  MAX(CASE WHEN a.question_code = 'FL01' THEN a.answer_label END)
    AS `How much decision-making authority sits with your team rather than with you?`,
  MAX(CASE WHEN a.question_code = 'G1' THEN a.answer_label END)
    AS `Is your brand name or logo trademarked, or has an application been filed?`,
  MAX(CASE WHEN a.question_code = 'G3' THEN a.answer_label END)
    AS `Are there any active legal disputes over brand ownership, intellectual property, or an existing franchisee?`,
  IF(s.report_token IS NULL, '',
     CONCAT('https://app.corpculture.co/franchise-audit/audit/report/', s.report_token))
                                                          AS `Result page link`
FROM audit_submissions s
LEFT JOIN audit_answers a ON a.submission_id = s.id
-- Last two days. For everything, delete this line; for a range, use e.g.
-- WHERE s.created_at >= '2026-10-11' AND s.created_at < '2026-10-14'
WHERE s.created_at >= NOW() - INTERVAL 3 DAY
GROUP BY s.id
ORDER BY s.created_at DESC;
