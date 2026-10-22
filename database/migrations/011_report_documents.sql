-- Screen 6, the Report (Report library v1.4 §2). The engine's output, frozen
-- when the founder submits: the page and the PDF render this row and never
-- re-run the assembly, so a Report cannot change between readings ("Final ·
-- does not change"). One per order, written once.
--
-- `content` is the assembled document (src/lib/report/assemble.ts). Its
-- `missing` list names strings the libraries do not yet hold; the review
-- panel holds the Report back until it is empty. Ronak's edits (T70) will be
-- stored as diffs against this row, never over it, when Screens 8–9 land.
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
  PRIMARY KEY (order_id),
  CONSTRAINT report_documents_order_fk FOREIGN KEY (order_id) REFERENCES report_orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
