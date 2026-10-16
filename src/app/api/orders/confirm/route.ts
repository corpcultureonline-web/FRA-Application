import { NextResponse } from "next/server";
import { withBasePath } from "@/lib/base-path";
import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { razorpayKeys } from "@/lib/payments/razorpay";
import { personalLinkPath, recordPayment } from "@/lib/payments/record";
import { isValidPaymentSignature } from "@/lib/payments/signatures";

/**
 * Razorpay Checkout's success handler posts here. The signature proves the
 * payment belongs to our order; without it nothing is granted. The webhook
 * records the same payment independently, in case this request never arrives.
 */
export async function POST(request: Request) {
  let body: { razorpay_order_id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    if (!isValidPaymentSignature({ orderId, paymentId, signature }, razorpayKeys().keySecret)) {
      reportError("Payment signature mismatch", new Error("Invalid Razorpay payment signature"));
      return NextResponse.json({ error: "signature" }, { status: 400 });
    }
    const order = await recordPayment(eventContext(request.headers), orderId, paymentId);
    if (!order) return NextResponse.json({ error: "order" }, { status: 404 });
    return NextResponse.json({ next: withBasePath(personalLinkPath(order.token)) });
  } catch (error) {
    reportError("Payment confirmation failed", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
