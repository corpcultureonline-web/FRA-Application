CREATE DATABASE IF NOT EXISTS FRAapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE FRAapp;

CREATE TABLE registrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  brand_name VARCHAR(255) NOT NULL,
  founder_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX registrations_email_idx (email)
 ) ENGINE=InnoDB;

-- Scoring config (weights, option values, bands, gates) as seeded data, so a
-- weight change is a data edit, not a deployment. Seed with
-- `npm run seed:scoring` from database/seed/tier1-scoring-config.json.
CREATE TABLE IF NOT EXISTS fra_scoring_config (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tier TINYINT UNSIGNED NOT NULL,
  version VARCHAR(50) NOT NULL,
  config JSON NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY fra_scoring_config_version (tier, version)
) ENGINE=InnoDB;

-- Free audit (Tier 1): the "About your business" profile plus the computed
-- result. Scores are DECIMAL, never FLOAT (decision S7). overall_score is
-- server-only: it must never be sent to the browser or put in an email.
CREATE TABLE IF NOT EXISTS audit_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  brand_name VARCHAR(255) NOT NULL,
  founder_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  -- Optional, left on the "Get my full report" confirmation.
  phone VARCHAR(20) NULL,
  category VARCHAR(100) NOT NULL,
  outlets VARCHAR(20) NOT NULL,
  city VARCHAR(255) NOT NULL,
  scoring_version VARCHAR(50) NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL,
  range_low TINYINT UNSIGNED NOT NULL,
  range_high TINYINT UNSIGNED NOT NULL,
  -- Band codes (B1–B5): before gates, and after gates.
  score_band CHAR(2) NOT NULL,
  band CHAR(2) NOT NULL,
  gate ENUM('pass', 'capped', 'hard') NOT NULL,
  weakest_pillar CHAR(2) NULL,
  -- Random token for the result page and PDF links (/audit/report/<token>, /api/report/<token>).
  report_token CHAR(32) NULL,
  -- The brand's FRA_Submissions record in Zoho CRM.
  zoho_record_id VARCHAR(32) NULL,
  -- Set when the founder taps "Get my full report" (Tier 2 interest).
  report_interest_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY audit_submissions_report_token (report_token),
  INDEX audit_submissions_email_idx (email)
) ENGINE=InnoDB;

-- One row per question. A skipped answer is NULL, never 0 (decision S6).
CREATE TABLE IF NOT EXISTS audit_answers (
  submission_id BIGINT UNSIGNED NOT NULL,
  question_code VARCHAR(10) NOT NULL,
  answer_label VARCHAR(255) NULL,
  answer_value TINYINT UNSIGNED NULL,
  PRIMARY KEY (submission_id, question_code),
  CONSTRAINT audit_answers_submission FOREIGN KEY (submission_id)
    REFERENCES audit_submissions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Server-only, for analysis and calibration. Never shown at Tier 1 (decision R3).
CREATE TABLE IF NOT EXISTS audit_pillar_scores (
  submission_id BIGINT UNSIGNED NOT NULL,
  pillar_code CHAR(2) NOT NULL,
  score DECIMAL(5,2) NULL,
  status ENUM('Good', 'Average', 'Weak') NULL,
  PRIMARY KEY (submission_id, pillar_code),
  CONSTRAINT audit_pillar_scores_submission FOREIGN KEY (submission_id)
    REFERENCES audit_submissions (id) ON DELETE CASCADE
) ENGINE=InnoDB;
-- Event log (Event-Log-Spec v1.0): append-only funnel and behaviour events.
-- No personal data in payload; submission_id is the join to the brand. The
-- only update is the submission_id backfill after scoring.
CREATE TABLE IF NOT EXISTS event_log (
  id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id     CHAR(36)     NOT NULL,
  submission_id  BIGINT       NULL,
  -- Paid runs join on the order (Event-Log-Spec v1.3 §2, T82). NULL for the Audit.
  order_id       BIGINT       NULL,
  event_type     VARCHAR(32)  NOT NULL,
  payload        JSON         NULL,
  is_internal    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_session    (session_id),
  INDEX idx_type_time  (event_type, created_at),
  INDEX idx_submission (submission_id),
  INDEX idx_order      (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The Report (Tier 2): one row per checkout attempt, from Pay to paid or failed.
-- No document defines this table (Event-Log-Spec v1.3 §2 leaves it to the
-- build); the event log fixes only that it is referenced by our own id.
--
-- Money is stored in paise, base exclusive of GST, with the rate in force, so
-- the invoice and the Razorpay charge agree to the paisa (CANONICAL-VALUES §1).
-- Consent records the version of each policy accepted (Decision T75).
CREATE TABLE IF NOT EXISTS report_orders (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  audit_submission_id  BIGINT UNSIGNED NOT NULL,
  status               ENUM('created', 'paid', 'failed') NOT NULL DEFAULT 'created',
  base_paise           INT UNSIGNED NOT NULL,
  gst_percent          DECIMAL(5,2) NOT NULL,
  amount_paise         INT UNSIGNED NOT NULL,
  -- Ten digits, without +91. Sent to Razorpay as the prefilled contact.
  mobile               CHAR(10) NOT NULL,
  -- A correction made on Screen 5; NULL means the Audit email (migration 009).
  delivery_email       VARCHAR(320) NULL,
  consent_at           TIMESTAMP(3) NOT NULL,
  -- {"terms": "1.2", "privacy": "1.2", "refunds": "1.4"}
  consent_versions     JSON NOT NULL,
  -- Entered through a direct-purchase link (P12, P14); excluded from free-tier conversion.
  direct_link          BOOLEAN NOT NULL DEFAULT FALSE,
  razorpay_order_id    VARCHAR(40) NULL,
  -- Unique: Razorpay retries webhooks, and a payment may only ever be granted once (T7).
  razorpay_payment_id  VARCHAR(40) NULL,
  failure_reason       VARCHAR(64) NULL,
  -- The private personal link, /report/my/<token>; set when the order is paid.
  token                CHAR(32) NULL,
  paid_at              TIMESTAMP(3) NULL,
  questions_started_at TIMESTAMP(3) NULL,
  -- The refund boundary (T72): set once, by Finish and send.
  submitted_at         TIMESTAMP(3) NULL,
  -- Set when the approved Report is sent (Screens 8–9).
  report_sent_at       TIMESTAMP(3) NULL,
  failed_at            TIMESTAMP(3) NULL,
  -- Admin §5: a refund, with who and when (migration 012).
  refunded_at          TIMESTAMP(3) NULL,
  refunded_by          INT UNSIGNED NULL,
  refund_paise         INT UNSIGNED NULL,
  refund_id            VARCHAR(40) NULL,
  -- Report Section 10: "Tell me about the Roadmap" (migration 013, T127).
  roadmap_interest_at  TIMESTAMP(3) NULL,
  created_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY report_orders_razorpay_order (razorpay_order_id),
  UNIQUE KEY report_orders_razorpay_payment (razorpay_payment_id),
  UNIQUE KEY report_orders_token (token),
  INDEX report_orders_submission (audit_submission_id, status),
  CONSTRAINT report_orders_submission_fk FOREIGN KEY (audit_submission_id)
    REFERENCES audit_submissions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The Report questionnaire (Screen 4). Answers save server-side on every
-- answer, keyed to the paid order, never the browser (T32), so a founder who
-- closes the tab or changes phone lands on the question he left.
--
-- One row per question. Exactly one of option_index, number_value or escape
-- is set. option_index is the position in the Strings file's option list;
-- points are not stored here — scoring reads the Strings file, server-side.
CREATE TABLE IF NOT EXISTS report_answers (
  order_id      BIGINT UNSIGNED NOT NULL,
  question_code VARCHAR(10) NOT NULL,
  option_index  TINYINT UNSIGNED NULL,
  number_value  DECIMAL(9,1) NULL,
  escape_kind   ENUM('not_applicable', 'dont_know', 'prefer_not') NULL,
  -- UE7's figure came from the EBITDA calculator (T47).
  computed      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (order_id, question_code),
  CONSTRAINT report_answers_order FOREIGN KEY (order_id) REFERENCES report_orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A contradiction the founder was shown (Field Help §5). 'proceeded' means he
-- confirmed the pair is correct — "some of the best material in the Report".
CREATE TABLE IF NOT EXISTS report_contradictions (
  order_id   BIGINT UNSIGNED NOT NULL,
  pair_code  VARCHAR(16) NOT NULL,
  outcome    ENUM('proceeded', 'amended') NOT NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (order_id, pair_code),
  CONSTRAINT report_contradictions_order FOREIGN KEY (order_id) REFERENCES report_orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Screen 7, Resume (Resume v1.1). The link emailed at the start of a paid run
-- (T32) and any fresh one sent from the expired state.
--
-- One live link per order: issuing a new one supersedes the old, and a
-- superseded link shows the expired state. Keeping every link, rather than
-- overwriting one column, is what lets an old link still find its order —
-- "Send me a new link" goes to the address on the order, never to one typed
-- on the page (§4). The draft itself never expires; only a link does.
CREATE TABLE IF NOT EXISTS report_resume_links (
  token          CHAR(32) NOT NULL,
  order_id       BIGINT UNSIGNED NOT NULL,
  issued_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  superseded_at  TIMESTAMP(3) NULL,
  PRIMARY KEY (token),
  INDEX report_resume_links_order (order_id, superseded_at),
  CONSTRAINT report_resume_links_order_fk FOREIGN KEY (order_id) REFERENCES report_orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Screen 6: the Report, frozen at submission (migration 011).
CREATE TABLE IF NOT EXISTS report_documents (
  order_id       BIGINT UNSIGNED NOT NULL,
  -- The document's own shape version (REPORT_SCHEMA), for a later reader.
  schema_version SMALLINT UNSIGNED NOT NULL,
  -- The scoring config it was scored with: tier1-1.1 …
  config_version VARCHAR(50) NOT NULL,
  overall_score  DECIMAL(5,2) NOT NULL,
  band           CHAR(2) NOT NULL,
  content        JSON NOT NULL,
  generated_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  -- Admin §3 (migration 012): the Report as sent, with edits applied; `content` never changes.
  approved_content JSON NULL,
  approved_at    TIMESTAMP(3) NULL,
  approved_by    INT UNSIGNED NULL,
  returned_at    TIMESTAMP(3) NULL,
  returned_by    INT UNSIGNED NULL,
  return_note    TEXT NULL,
  PRIMARY KEY (order_id),
  CONSTRAINT report_documents_order_fk FOREIGN KEY (order_id) REFERENCES report_orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Screens 8 and 9, the review panel (migration 012).
CREATE TABLE IF NOT EXISTS panel_users (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email      VARCHAR(320) NOT NULL,
  name       VARCHAR(100) NOT NULL,
  -- Approvers act; the team login only reads (T36, T37).
  role       ENUM('approver', 'team') NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY panel_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO panel_users (email, name, role) VALUES
  ('sakthi@corpculture.co', 'Sakthikkumaran', 'approver'),
  ('ronak@corpculture.co', 'Ronak Patel', 'approver'),
  ('bd@corpculture.co', 'Team', 'team');

CREATE TABLE IF NOT EXISTS panel_links (
  token_hash CHAR(64) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  expires_at TIMESTAMP(3) NOT NULL,
  used_at    TIMESTAMP(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_hash),
  CONSTRAINT panel_links_user_fk FOREIGN KEY (user_id) REFERENCES panel_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS panel_sessions (
  token_hash CHAR(64) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  expires_at TIMESTAMP(3) NOT NULL,
  ended_at   TIMESTAMP(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_hash),
  CONSTRAINT panel_sessions_user_fk FOREIGN KEY (user_id) REFERENCES panel_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_edits (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id   BIGINT UNSIGNED NOT NULL,
  -- Where in the Report: "06.UE", "01.lead" … (src/lib/report/pieces.ts).
  slot       VARCHAR(64) NOT NULL,
  -- The library piece that filled it: "C-UE-B2", "LF-NO-ENTITY" …
  piece_id   VARCHAR(64) NOT NULL,
  original   JSON NOT NULL,
  edited     JSON NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX report_edits_order (order_id, slot, id),
  INDEX report_edits_piece (piece_id),
  CONSTRAINT report_edits_order_fk FOREIGN KEY (order_id) REFERENCES report_orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

