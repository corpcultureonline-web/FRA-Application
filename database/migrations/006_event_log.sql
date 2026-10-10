-- Event log (Event-Log-Spec v1.0 §2): one append-only table of funnel and
-- behaviour events, joinable to a brand's submission. Nothing updates a row
-- except the submission_id backfill after scoring (§5).
CREATE TABLE IF NOT EXISTS event_log (
  id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id     CHAR(36)     NOT NULL,
  submission_id  BIGINT       NULL,
  event_type     VARCHAR(32)  NOT NULL,
  payload        JSON         NULL,
  is_internal    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_session    (session_id),
  INDEX idx_type_time  (event_type, created_at),
  INDEX idx_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
