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
  failed_at            TIMESTAMP(3) NULL,
  created_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY report_orders_razorpay_order (razorpay_order_id),
  UNIQUE KEY report_orders_razorpay_payment (razorpay_payment_id),
  UNIQUE KEY report_orders_token (token),
  INDEX report_orders_submission (audit_submission_id, status),
  CONSTRAINT report_orders_submission_fk FOREIGN KEY (audit_submission_id)
    REFERENCES audit_submissions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event-Log-Spec v1.3 §2 (T82): paid runs join on the order, not the session,
-- so a founder who resumes on another device keeps one run. NULL for the Audit.
ALTER TABLE event_log
  ADD COLUMN order_id BIGINT NULL AFTER submission_id,
  ADD INDEX idx_order (order_id);
