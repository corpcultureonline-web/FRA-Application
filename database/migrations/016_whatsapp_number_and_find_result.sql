-- Developer handoff v3.1 (30 October 2026) §5 and §6.
--
-- §5.1: the Audit asks for a WhatsApp number on Section 1, mandatory, and it
-- is stored "from the moment Section 1 is submitted, so an abandoner is still
-- reachable". audit_submissions.phone (migration 004) already holds it once the
-- Audit is scored; audit_leads holds Section 1 for everyone who got that far,
-- linked to the submission when there is one. One open row per browser
-- session (the event log's session id), updated if Section 1 is edited.
--
-- §6: /find-my-result looks a contact up by email or mobile, so the Audit's
-- phone gets an index (email has one), and result_link_requests is the rate
-- limit: by contact and by IP, both hashed, so the table never holds an
-- address in the clear. Tier 1 only: the Report's order table gets its index
-- in 017, with the Report.

CREATE TABLE IF NOT EXISTS audit_leads (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id     CHAR(36) NOT NULL,
  brand_name     VARCHAR(255) NOT NULL,
  founder_name   VARCHAR(255) NOT NULL,
  email          VARCHAR(320) NOT NULL,
  -- Ten digits, without +91.
  phone          CHAR(10) NOT NULL,
  category       VARCHAR(100) NOT NULL,
  outlets        VARCHAR(20) NOT NULL,
  city           VARCHAR(255) NOT NULL,
  -- Set when this session's Audit is scored; NULL means it was abandoned (so far).
  submission_id  BIGINT UNSIGNED NULL,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX audit_leads_session (session_id, submission_id),
  INDEX audit_leads_open (submission_id, created_at),
  CONSTRAINT audit_leads_submission_fk FOREIGN KEY (submission_id) REFERENCES audit_submissions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE audit_submissions
  ADD INDEX audit_submissions_phone_idx (phone);

CREATE TABLE IF NOT EXISTS result_link_requests (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- sha256 of the normalised email or ten-digit mobile.
  contact_hash  CHAR(64) NOT NULL,
  -- sha256 of the client IP.
  ip_hash       CHAR(64) NOT NULL,
  created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX result_link_requests_contact (contact_hash, created_at),
  INDEX result_link_requests_ip (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
