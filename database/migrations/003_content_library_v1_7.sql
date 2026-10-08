-- Content Library v1.7 replaces the v1.0 rows: triggers changed (outlets_band),
-- pieces were deleted (WN-NO-TRADEMARK, WN-LEGAL-EARLY) or renamed
-- (CT-RANK-FEW, CDN-LEAD-CLEAN), and Can Do Now split into two sections. The
-- seed uses INSERT IGNORE, which would keep the stale rows — so clear the table
-- once, then run database/seed/tier1-content.sql.
--
-- Run ONCE, before the first v1.7 seed, and only while nobody has edited
-- wording in content_piece (true as of 8 October 2026). Never run it again
-- afterwards: it would discard Ronak's edits.
DELETE FROM content_piece;
