-- Screen 5 (Submitted v1.2). Where the Report goes, and whether it has gone.
--
-- delivery_email: a correction made on Screen 5. NULL means the email given in
-- the Audit. Kept on the order rather than written back to the Audit record,
-- so the free Audit's data is never changed by a paid run. The Report goes to
-- the address as it stands at send time, not as captured at submission (§7).
-- The mobile number is corrected in place on report_orders.mobile.
--
-- report_sent_at: set by the review panel when Ronak approves and the Report
-- is sent (Screens 8–9). From then the personal link shows "Your Report is ready".
ALTER TABLE report_orders
  ADD COLUMN delivery_email VARCHAR(320) NULL AFTER mobile,
  ADD COLUMN report_sent_at TIMESTAMP(3) NULL AFTER submitted_at;
