/**
 * A one-rupee Report for the addresses in REPORT_TEST_EMAILS (comma-separated),
 * so a live payment, delivery and refund can be tested end to end without
 * paying ₹2,359 (4 November 2026). Matched on the Audit's email address, which
 * is not verified, so set it only for the test and remove it straight after.
 * Unset, as it should normally be, every order pays payable("report").
 *
 * Only the charge changes: ₹1 base, 18% GST, rounded to the nearest rupee as
 * every price is (P10), so ₹1. The order stores it, so the panel and the
 * refund read ₹1 too. The checkout page still shows the real price.
 */
export const TEST_PRICE_RUPEES = 1;

export function isTestPriceEmail(email: string, env: Record<string, string | undefined> = process.env): boolean {
  const listed = (env.REPORT_TEST_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return listed.length > 0 && listed.includes(email.trim().toLowerCase());
}
