-- Developer handoff v3.1 (30 October 2026) §2.3 and §2.5: the result page's
-- offer block takes Content-Library-Tier1-Result-Page.md v1.16 §3 as written.
-- The category-comparison bullet is deleted (Section 08 of the Report stays),
-- "areas" becomes "pillars" (T158), and the last line reads "your Report
-- within 24 hours on working days". The seed uses INSERT IGNORE, so this needs
-- an UPDATE. Only rewrites the row while it still carries the deleted bullet,
-- so an edit made in the table since is never overwritten. Covers 014 too.
UPDATE content_piece
   SET body = 'About thirty more questions, roughly 15 minutes. Your earlier answers carry over — no question is asked twice.\n\n- **Your exact score** — one number, not a range\n- **All 7 pillars explained in writing** — what is working, what is not, and why it matters for franchising\n- **Your problems ranked** — so you know which pillar to work on first\n- **Your full legal and approvals check**\n\n**₹1,999 + 18% GST** · ₹2,359 payable\n\nYou will receive your Report within 24 hours on working days.'
 WHERE id = 'UPGRADE-TIER2'
   AND body LIKE '%compared with similar brands we have worked with%';
