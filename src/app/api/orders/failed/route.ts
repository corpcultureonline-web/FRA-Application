import { NextResponse } from "next/server";
import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { recordFailure } from "@/lib/payments/record";

/**
 * The checkout screen reports a failed or cancelled payment, so payment_failed
 * is written even when no webhook follows (a closed modal sends none). Only an
 * unpaid order can be marked failed; a paid one is never moved back.
 */
export async function POST(request: Request) {
  let body: { razorpay_order_id?: unknown; reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (typeof body.razorpay_order_id !== "string") return new NextResponse(null, { status: 204 });
  const reason = typeof body.reason === "string" && /^[A-Za-z_]{1,64}$/.test(body.reason) ? body.reason : "unknown";

  try {
    await recordFailure(eventContext(request.headers), body.razorpay_order_id, reason);
  } catch (error) {
    reportError("Payment failure record failed", error);
  }
  return new NextResponse(null, { status: 204 });
}
