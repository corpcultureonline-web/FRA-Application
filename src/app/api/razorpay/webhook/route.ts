import { NextResponse } from "next/server";
import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { webhookSecret } from "@/lib/payments/razorpay";
import { recordFailure, recordPayment } from "@/lib/payments/record";
import { isValidWebhookSignature } from "@/lib/payments/signatures";

/**
 * Razorpay's webhook: the record of a payment that does not depend on the
 * founder's browser staying open. Signature verified against the raw body;
 * idempotent on the payment, because Razorpay retries (Decision T7).
 *
 * Subscribe to payment.captured, order.paid and payment.failed.
 */
type PaymentEntity = { id?: string; order_id?: string; error_code?: string | null };
type WebhookBody = { event?: string; payload?: { payment?: { entity?: PaymentEntity } } };

export async function POST(request: Request) {
  const secret = webhookSecret();
  if (!secret) {
    reportError("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured", new Error("No webhook secret"));
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!isValidWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "signature" }, { status: 400 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const payment = body.payload?.payment?.entity;
  if (!payment?.order_id || !payment.id) return NextResponse.json({ ok: true });

  const context = eventContext(request.headers);
  try {
    if (body.event === "payment.captured" || body.event === "order.paid") {
      await recordPayment(context, payment.order_id, payment.id);
    } else if (body.event === "payment.failed") {
      await recordFailure(context, payment.order_id, payment.error_code ?? "failed");
    }
  } catch (error) {
    reportError(`Razorpay webhook ${body.event} failed`, error);
    // Non-2xx makes Razorpay retry, which is what we want after a database error.
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
