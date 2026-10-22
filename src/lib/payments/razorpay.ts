import "server-only";

/**
 * Razorpay over its REST API — one call, so no SDK (Decision T7). Keys come
 * from the environment: test keys (rzp_test_…) until the first live payment.
 */
const API = "https://api.razorpay.com/v1";

export function razorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not configured.");
  return { keyId, keySecret };
}

export function webhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET || null;
}

/** Creates the Razorpay order a Checkout payment is made against. Amount in paise. */
export async function createRazorpayOrder({
  amountPaise,
  receipt,
  orderId,
}: {
  amountPaise: number;
  receipt: string;
  orderId: number;
}): Promise<string> {
  const { keyId, keySecret } = razorpayKeys();
  const response = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    // Our own order id travels in the notes, so a webhook can be matched even
    // if the Razorpay order id were ever missing from our row.
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes: { order_id: String(orderId) } }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as { id?: string; error?: { description?: string } } | null;
  if (!response.ok || !body?.id) {
    throw new Error(`Razorpay order failed (${response.status}): ${body?.error?.description ?? "no response body"}`);
  }
  return body.id;
}

/**
 * Refunds a captured payment in full (Admin library §5). Amount in paise.
 * Returns Razorpay's refund id. The payment id is our record of what was paid;
 * nothing typed in the panel reaches this call.
 */
export async function refundPayment({
  paymentId,
  amountPaise,
  orderId,
}: {
  paymentId: string;
  amountPaise: number;
  orderId: number;
}): Promise<string> {
  const { keyId, keySecret } = razorpayKeys();
  const response = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: amountPaise, speed: "normal", notes: { order_id: String(orderId) } }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as { id?: string; error?: { description?: string } } | null;
  if (!response.ok || !body?.id) {
    throw new Error(`Razorpay refund failed (${response.status}): ${body?.error?.description ?? "no response body"}`);
  }
  return body.id;
}
