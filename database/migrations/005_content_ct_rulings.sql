-- Content Library §22 rulings (8 October 2026). The seed uses INSERT IGNORE,
-- so a changed body never reaches an existing row on its own.
--
-- §22.3: CT-INTRO says "more than forty" — the total is 43 to 46 by outlet band.
-- Only rewrites the row if its wording is still the original, so an edit made
-- in the table is never overwritten.
UPDATE content_piece
   SET body = 'You answered eleven questions. Nine of them carry a score, and your full result is decided by more than forty. Three things these eleven cannot answer:'
 WHERE id = 'CT-INTRO'
   AND body = 'You answered eleven questions. Nine of them carry a score, and your full result is decided by forty. Three things these eleven cannot answer:';

-- §22.4: CT-CLOSE replaces the "answers all three" box. Inactive until Ronak
-- signs it off; activate with UPDATE content_piece SET active = TRUE WHERE id = 'CT-CLOSE'.
INSERT IGNORE INTO content_piece (id, section, note_type, priority, trigger_expr, heading, body, active)
VALUES ('CT-CLOSE', 'CANNOT_TELL', NULL, 10, 'ALWAYS', NULL,
        'These three are the reason the Report exists. It works through each of them with your own numbers.', FALSE);
