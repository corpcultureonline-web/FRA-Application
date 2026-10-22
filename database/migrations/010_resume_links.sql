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
