import "server-only";
import { after } from "next/server";
import { sendGaServerEvent, type GaServerEvent } from "@/lib/analytics/ga-server";
import { getDatabase } from "@/lib/db";
import { reportError } from "@/lib/monitoring/report-error";
import { advanceState, personForRun, resolveIdentity, setFlags } from "./identity";
import { identitySchemaReady, isMissingSchema, noteMissingSchema, personFor, type EventContext } from "./server";

/**
 * Where the funnel's events move a person through the lifecycle
 * (Identity handoff, 20 Nov, §5). Each hook is best effort: bookkeeping never
 * stops an Audit, a payment or a Report.
 */

/**
 * GA4 is told after the response has gone, so Razorpay's webhook and the
 * founder's tap never wait on Google. Outside a request (a script), sent now.
 */
function reportToGa(name: GaServerEvent, orderId: number, params?: Record<string, string | number>) {
  try {
    after(() => sendGaServerEvent(name, orderId, params));
  } catch {
    void sendGaServerEvent(name, orderId, params);
  }
}

async function safely(what: string, work: () => Promise<unknown>, extra: Record<string, number | undefined> = {}) {
  // Until migration 018 runs there is no person to move: skipped quietly.
  if (!identitySchemaReady()) return;
  try {
    await work();
  } catch (error) {
    if (isMissingSchema(error)) noteMissingSchema();
    else reportError(`Lifecycle: ${what} failed`, error, extra);
  }
}

/** Section 1 saved: the visitor becomes a User (§5.1, §6.2). */
export async function onSection1(context: EventContext, contact: { phone: string; email: string }) {
  await safely("identifying Section 1", () => resolveIdentity(context, contact));
}

/** audit_scored: a Participant. Identifies again first, in case the Section 1 save never arrived. */
export async function onAuditScored(
  context: EventContext,
  contact: { phone: string; email: string },
  submissionId: number,
) {
  await safely(
    "marking a Participant",
    async () => {
      const personId = await resolveIdentity(context, contact);
      if (personId) await advanceState(context, personId, "participant", { submissionId });
    },
    { submission_id: submissionId },
  );
}

/** payment_succeeded: a Customer, with the questions still to answer (§5.2). Reported to GA4 from here (§3.4). */
export async function onPaymentSucceeded(context: EventContext, orderId: number, auditId: number, amountPaise: number) {
  reportToGa("payment_succeeded", orderId, { value: amountPaise / 100, currency: "INR" });
  await safely(
    "marking a Customer",
    async () => {
      const personId = await personForRun(context, { submissionId: auditId });
      if (personId) await advanceState(context, personId, "customer", { orderId, submissionId: auditId });
    },
    { order_id: orderId },
  );
}

/** questionnaire_submitted: the paid questions are done. */
export async function onQuestionnaireSubmitted(context: EventContext, orderId: number, auditId: number) {
  reportToGa("questionnaire_submitted", orderId);
  await safely(
    "clearing paid_questions_incomplete",
    async () => {
      const personId = await personForRun(context, { submissionId: auditId });
      if (personId) await setFlags(personId, { paid_questions_incomplete: false });
    },
    { order_id: orderId },
  );
}

/** report_sent for the paid tier: a Client. */
export async function onReportSent(context: EventContext, orderId: number) {
  reportToGa("report_sent", orderId);
  await safely(
    "marking a Client",
    async () => {
      const personId = await personForRun(context, { orderId });
      if (personId) await advanceState(context, personId, "client", { orderId });
    },
    { order_id: orderId },
  );
}

type BrowserEvent = { type: string; payload: Record<string, unknown> };

/**
 * Drop-off flags from the browser's own events (§5.2): the upgrade clicked
 * by a Participant who has not paid (the calling team's list), and the
 * Audit section a User stopped at.
 */
export async function onBrowserEvents(context: EventContext, events: BrowserEvent[]) {
  const upgrade = events.some((e) => e.type === "cta_clicked" && e.payload.cta === "tier2_upgrade");
  const stalled = events.findLast(
    (e) => e.type === "page_exit" && e.payload.completed === false && typeof e.payload.furthest_section === "number",
  );
  if (!upgrade && !stalled) return;
  await safely("setting drop-off flags", async () => {
    const personId = await personFor(getDatabase(), context.visitorId, {});
    if (!personId) return;
    if (upgrade) await setFlags(personId, { upgrade_clicked_unpaid: true }, ["participant"]);
    if (stalled) await setFlags(personId, { stalled_at_section: stalled.payload.furthest_section as number }, ["user"]);
  });
}
