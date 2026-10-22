import "server-only";
import { reportError } from "@/lib/monitoring/report-error";
import { delivery } from "@/lib/payments/delivery";
import { firstResumeLink, replaceResumeLink } from "@/lib/payments/resume";
import { EmailUnavailable, sendEmail } from "./email";
import { relinkEmail, resumeEmail } from "./resume-email";

/**
 * The start of a paid run: issue the resume link and email it, before the
 * first answer (T32). Called once, when a payment is first recorded. The link
 * exists whether or not the email goes, so Screen 7 always has one to replace.
 */
export async function startRun(orderId: number) {
  try {
    const token = await firstResumeLink(orderId);
    const where = await delivery(orderId);
    if (!where) return;
    await sendEmail(resumeEmail(where.email, token));
  } catch (error) {
    if (error instanceof EmailUnavailable) {
      console.warn(`Resume email not sent for order ${orderId}: email is not configured.`);
      return;
    }
    reportError("Resume email failed", error, { order_id: orderId });
  }
}

/**
 * Screen 7's "Send me a new link": a fresh link to the address on the order,
 * never one typed on the page (Resume §4). The old link is retired only once
 * the new one has been sent; throws otherwise, so the page never says "Sent"
 * when nothing went.
 */
export async function sendFreshLink(orderId: number) {
  const where = await delivery(orderId);
  if (!where) throw new Error(`No delivery address for order ${orderId}`);
  await replaceResumeLink(orderId, (token) => sendEmail(relinkEmail(where.email, token)));
}
