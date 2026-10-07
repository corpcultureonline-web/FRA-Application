-- Results PDF: each submission gets a random, unguessable token so its report
-- can be shared as /api/report/<token>.pdf (e.g. in the Zoho email) without
-- exposing sequential ids. Existing rows stay NULL and get no report link.
ALTER TABLE audit_submissions
  ADD COLUMN report_token CHAR(32) NULL AFTER weakest_pillar,
  ADD UNIQUE KEY audit_submissions_report_token (report_token);
