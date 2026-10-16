import "server-only";
import { logOrderEvent, type EventContext } from "@/lib/events/server";
import { markFailed, markPaid } from "./orders";

/**
 * The two outcomes of a payment, shared by the browser's confirm, its failure
 * notice and Razorpay's webhook. Each writes its event once per order, because
 * markPaid and markFailed only report a change the first time.
 */

export async function recordPayment(context: EventContext, razorpayOrderId: string, razorpayPaymentId: string) {
  const order = await markPaid(razorpayOrderId, razorpayPaymentId);
  if (order?.newlyPaid) {
    await logOrderEvent(
      context,
      "payment_succeeded",
      {
        order_id: order.orderId,
        amount_paise: order.amountPaise,
        razorpay_payment_id: razorpayPaymentId,
        direct_link: order.directLink,
      },
      order.orderId,
      order.auditId,
    );
  }
  return order;
}

export async function recordFailure(context: EventContext, razorpayOrderId: string, reasonCode: string) {
  const orderId = await markFailed(razorpayOrderId, reasonCode);
  if (orderId) await logOrderEvent(context, "payment_failed", { order_id: orderId, reason_code: reasonCode }, orderId);
  return orderId;
}

/** The personal link the founder lands on once paid (CANONICAL-VALUES §4). */
export function personalLinkPath(token: string) {
  return `/report/my/${token}`;
}
