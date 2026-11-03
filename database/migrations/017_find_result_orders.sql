-- Developer handoff v3.1 (30 October 2026) §6: /find-my-result also finds a
-- paid Report by the WhatsApp number given at checkout. The Tier 1 half of
-- this lookup is migration 016.
ALTER TABLE report_orders
  ADD INDEX report_orders_mobile (mobile);
