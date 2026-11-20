-- Identity stitching, attribution and lifecycle (Developer-Handoff-Identity-
-- Attribution, 20 Nov 2026, §2). Adds columns and tables; nothing existing is
-- rewritten. Run before deploying the code that writes them: every event_log
-- insert names visitor_id and person_id.
--
-- Surrogate keys only: no name, email, phone or brand name ever enters
-- event_log (Event-Log-Spec §8). Contact details stay in audit_submissions.

ALTER TABLE event_log
  ADD COLUMN visitor_id CHAR(36) NULL AFTER session_id,
  ADD COLUMN person_id  BIGINT   NULL AFTER visitor_id,
  ADD INDEX idx_visitor (visitor_id),
  ADD INDEX idx_person  (person_id);

-- One row per browser. First touch is frozen when the row is created and never
-- updated; last touch lives on each session_started (§2.2, §3.1).
CREATE TABLE IF NOT EXISTS visitor (
  visitor_id        CHAR(36)     NOT NULL PRIMARY KEY,
  person_id         BIGINT       NULL,
  first_seen_at     TIMESTAMP(3) NOT NULL,
  last_seen_at      TIMESTAMP(3) NOT NULL,
  ft_channel        VARCHAR(24)  NULL,
  ft_source         VARCHAR(64)  NULL,
  ft_medium         VARCHAR(64)  NULL,
  ft_campaign       VARCHAR(128) NULL,
  ft_content        VARCHAR(128) NULL,
  ft_term           VARCHAR(128) NULL,
  ft_referrer_host  VARCHAR(128) NULL,
  ft_landing_path   VARCHAR(255) NULL,
  -- gclid / fbclid / wbraid / gbraid
  ft_click_id       VARCHAR(255) NULL,
  ft_click_id_type  VARCHAR(12)  NULL,
  INDEX idx_person (person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per identified human (§2.3). Hashes, not contact details: sha256 of
-- the E.164 number and of the lowercased, trimmed email.
CREATE TABLE IF NOT EXISTS person (
  person_id     BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  phone_hash    CHAR(64)     NULL,
  email_hash    CHAR(64)     NULL,
  -- user | participant | customer | client (§5); only ever moves forward.
  state         VARCHAR(16)  NOT NULL,
  -- {"stalled_at_section": 4, "upgrade_clicked_unpaid": true, "paid_questions_incomplete": false}
  status_flags  JSON         NULL,
  first_seen_at TIMESTAMP(3) NOT NULL,
  UNIQUE KEY uq_phone (phone_hash),
  UNIQUE KEY uq_email (email_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
