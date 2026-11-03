/**
 * Payment checks (Decision T7): Razorpay's signatures, and the mobile number
 * checkout takes in its own field (Checkout library v1.1).
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { isValidPaymentSignature, isValidWebhookSignature, normaliseMobile } from "./signatures.ts";

const SECRET = "test_secret";
const sign = (message: string) => createHmac("sha256", SECRET).update(message).digest("hex");

describe("Razorpay payment signature", () => {
  const orderId = "order_PdH1Xh7fOzYqVb";
  const paymentId = "pay_PdH2Kq1vBn7rTz";

  it("accepts HMAC-SHA256 of order_id|payment_id", () => {
    assert.equal(isValidPaymentSignature({ orderId, paymentId, signature: sign(`${orderId}|${paymentId}`) }, SECRET), true);
  });

  it("rejects a signature for another payment, or a different secret", () => {
    const forOther = sign(`${orderId}|pay_other`);
    assert.equal(isValidPaymentSignature({ orderId, paymentId, signature: forOther }, SECRET), false);
    assert.equal(
      isValidPaymentSignature({ orderId, paymentId, signature: sign(`${orderId}|${paymentId}`) }, "other_secret"),
      false,
    );
    assert.equal(isValidPaymentSignature({ orderId, paymentId, signature: "" }, SECRET), false);
  });
});

describe("Razorpay webhook signature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: {} });

  it("accepts HMAC-SHA256 of the raw body", () => {
    assert.equal(isValidWebhookSignature(body, sign(body), SECRET), true);
  });

  it("rejects a body changed after signing", () => {
    assert.equal(isValidWebhookSignature(`${body} `, sign(body), SECRET), false);
  });
});

describe("mobile number", () => {
  it("takes ten digits starting 6–9, with spaces or a +91 / 0 prefix", () => {
    assert.equal(normaliseMobile("98765 43210"), "9876543210");
    assert.equal(normaliseMobile("+91 98765-43210"), "9876543210");
    assert.equal(normaliseMobile("09876543210"), "9876543210");
    assert.equal(normaliseMobile("6000000000"), "6000000000");
  });

  it("refuses anything else", () => {
    for (const bad of ["", "987654321", "98765432101", "5876543210", "98765abcde", "+1 9876543210"]) {
      assert.equal(normaliseMobile(bad), null, bad);
    }
  });
});
