-- Screens 8 and 9, the review panel (Admin library v1.3). Who may sign in,
-- how, what they approved, returned, edited and refunded — every money
-- decision carries a name and a time (§6).

-- §8: three accounts, seeded here. No sign-up; a fourth person is a new row.
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

-- §8: a sign-in link works once and lasts 15 minutes. Only a hash is kept.
CREATE TABLE IF NOT EXISTS panel_links (
  token_hash CHAR(64) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  expires_at TIMESTAMP(3) NOT NULL,
  used_at    TIMESTAMP(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_hash),
  CONSTRAINT panel_links_user_fk FOREIGN KEY (user_id) REFERENCES panel_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- §8: approvers stay signed in 30 days, the (possibly shared) team login 7.
CREATE TABLE IF NOT EXISTS panel_sessions (
  token_hash CHAR(64) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  expires_at TIMESTAMP(3) NOT NULL,
  ended_at   TIMESTAMP(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_hash),
  CONSTRAINT panel_sessions_user_fk FOREIGN KEY (user_id) REFERENCES panel_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- §1, §3: the review outcome, on the frozen Report. approved_content is the
-- document as sent — the generated one with the reviewer's edits applied
-- (T70); `content` is never changed.
ALTER TABLE report_documents
  ADD COLUMN approved_content JSON NULL,
  ADD COLUMN approved_at      TIMESTAMP(3) NULL,
  ADD COLUMN approved_by      INT UNSIGNED NULL,
  ADD COLUMN returned_at      TIMESTAMP(3) NULL,
  ADD COLUMN returned_by      INT UNSIGNED NULL,
  ADD COLUMN return_note      TEXT NULL;

-- §3: every edit is a row, never an overwrite: what the library produced and
-- what the reviewer wrote. `edited` NULL is "Restore the library version".
-- The latest row per (order, slot) is the one that stands.
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

-- §5: a refund is an action on the order, recorded with who and when.
ALTER TABLE report_orders
  ADD COLUMN refunded_at  TIMESTAMP(3) NULL,
  ADD COLUMN refunded_by  INT UNSIGNED NULL,
  ADD COLUMN refund_paise INT UNSIGNED NULL,
  ADD COLUMN refund_id    VARCHAR(40) NULL;
