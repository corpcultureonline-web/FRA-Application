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

-- submitted_at is the refund boundary (T72): set once, by Finish and send.
ALTER TABLE report_orders
  ADD COLUMN questions_started_at TIMESTAMP(3) NULL AFTER paid_at,
  ADD COLUMN submitted_at TIMESTAMP(3) NULL AFTER questions_started_at;
