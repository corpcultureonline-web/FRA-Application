-- "Get my full report" (Tier 2 interest): the founder may leave an optional
-- mobile number on the confirmation (Content Library §20), and the interest is
-- pushed to the brand's Zoho record — so keep that record's id.
ALTER TABLE audit_submissions
  ADD COLUMN phone VARCHAR(20) NULL AFTER email,
  ADD COLUMN zoho_record_id VARCHAR(32) NULL AFTER report_token;
