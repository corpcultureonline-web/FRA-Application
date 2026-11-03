-- Report Section 10 (Report library v1.11, T127): the Roadmap is not built
-- yet, so "Tell me about the Roadmap" registers interest instead of selling.
-- Mirrors the Audit's report_interest_at: the MySQL record is the one that
-- counts; the Zoho push (Tier_3_Interest_At) is fire-and-forget on top of it.
ALTER TABLE report_orders
  ADD COLUMN roadmap_interest_at TIMESTAMP(3) NULL;
