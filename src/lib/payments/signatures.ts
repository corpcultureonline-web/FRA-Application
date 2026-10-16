import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay's two signatures, both HMAC-SHA256 in hex (Decision T7: signature
 * verified). Pure, so the tests can check them against known vectors.
 */

function hmac(secret: string, message: string) {
  return createHmac("sha256", secret).update(message).digest("hex");
}

function sameHex(expected: string, given: string) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The signature Checkout hands back on success: HMAC of "<order_id>|<payment_id>" with the key secret. */
export function isValidPaymentSignature(
  { orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string },
  keySecret: string,
) {
  return sameHex(hmac(keySecret, `${orderId}|${paymentId}`), signature);
}

/** X-Razorpay-Signature: HMAC of the raw request body with the webhook secret. */
export function isValidWebhookSignature(rawBody: string, signature: string, webhookSecret: string) {
  return sameHex(hmac(webhookSecret, rawBody), signature);
}

/** Ten digits starting 6–9, after removing spaces, dashes and a +91 or 0 prefix. */
export function normaliseMobile(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "").replace(/^(\+?91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
