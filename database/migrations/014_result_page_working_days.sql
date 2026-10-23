-- Client review, 23 October 2026: the result page's offer card promised the
-- Report "within 24 hours" without "on working days", which the Refund Policy
-- and Terms §3 both carry (T73). The seed uses INSERT IGNORE, so the change
-- needs an UPDATE. Only rewrites the row if its wording is still the original,
-- so an edit made in the table is never overwritten.
-- Numbered 014 because 007–013 are taken by the Report (Tier 2) migrations.
UPDATE content_piece
   SET body = REPLACE(body, 'You will receive your report within 24 hours.', 'You will receive your report within 24 hours on working days.')
 WHERE id = 'UPGRADE-TIER2'
   AND body LIKE '%You will receive your report within 24 hours.';
