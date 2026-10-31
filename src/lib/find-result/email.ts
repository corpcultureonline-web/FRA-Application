import { BRAND_ENTITY_LINE } from "../company.ts";
import { T1F } from "./strings.ts";

/**
 * The four recovery emails (Find-Result library §5–§6), by how far the
 * founder got. One envelope for all four: greeting, body, action, sign-off,
 * then T1F-MAIL-WHYTHIS above the entity line — never optional, because this
 * form sends to whatever address is typed. Plain text first; the HTML adds
 * layout, never words.
 */
export type Stage = "audit" | "questions" | "waiting" | "report";
/** A paid order and a newer free Audit from the same contact (§8, v1.1): both, in one message. */
export type MailKind = Stage | "both";

export type Recovery = {
  stage: MailKind;
  to: string;
  founderName: string;
  /** When the Audit was completed; the audit and both emails print it. */
  completedAt: Date;
  /** When the Report was bought; the both email prints it. */
  paidAt?: Date;
  /** Where the main action goes. */
  url: string;
  /**
   * The second action: on the audit email, the Report's landing page where it
   * is on sale; on the both email, the paid Report's own link.
   */
  secondUrl?: string;
};

const MAIL = {
  audit: { subject: "T1F-MAIL-AUDIT-SUBJ", body: "T1F-MAIL-AUDIT-BODY", cta: "T1F-MAIL-AUDIT-CTA" },
  questions: { subject: "T1F-MAIL-QUESTIONS-SUBJ", body: "T1F-MAIL-QUESTIONS-BODY", cta: "T1F-MAIL-QUESTIONS-CTA" },
  waiting: { subject: "T1F-MAIL-WAITING-SUBJ", body: "T1F-MAIL-WAITING-BODY", cta: "T1F-MAIL-WAITING-CTA" },
  report: { subject: "T1F-MAIL-REPORT-SUBJ", body: "T1F-MAIL-REPORT-BODY", cta: "T1F-MAIL-REPORT-CTA" },
  both: { subject: "T1F-MAIL-BOTH-SUBJ", body: "T1F-MAIL-BOTH-BODY", cta: "T1F-MAIL-BOTH-CTA" },
} as const;

/** Only these two carry a second action (§5, §8). */
const SECOND_CTA = { audit: "T1F-MAIL-AUDIT-CTA2", both: "T1F-MAIL-BOTH-CTA2" } as const;

/** "21 October 2026", as the board prints {date}, in India time. */
export function longDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);
}

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function recoveryEmail(recovery: Recovery) {
  const keys = MAIL[recovery.stage];
  const greeting = T1F["T1F-MAIL-GREETING"].replace("{founder_name}", recovery.founderName);
  const body = T1F[keys.body]
    .replace("{date}", longDate(recovery.completedAt))
    .replace("{paid_date}", recovery.paidAt ? longDate(recovery.paidAt) : "");
  const actions: { label: string; url: string }[] = [{ label: T1F[keys.cta], url: recovery.url }];
  // The audit email offers the Report where it is on sale (§5); the both email, the paid Report (§8).
  const second = recovery.stage === "audit" || recovery.stage === "both" ? SECOND_CTA[recovery.stage] : null;
  if (second && recovery.secondUrl) actions.push({ label: T1F[second], url: recovery.secondUrl });
  const footer = [T1F["T1F-MAIL-WHYTHIS"], BRAND_ENTITY_LINE];

  const text = [
    greeting,
    body,
    ...actions.map((action) => `${action.label}: ${action.url}`),
    T1F["T1F-MAIL-SIGNOFF"],
    ...footer,
  ].join("\n\n");

  const [primary, secondary] = actions;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#231f20">
<div style="max-width:520px">
<p style="margin:0 0 16px;font-size:16px;line-height:1.6">${escape(greeting)}</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6">${escape(body)}</p>
<p style="margin:24px 0 12px"><a href="${escape(primary.url)}" style="display:inline-block;padding:14px 24px;border-radius:6px;background:#f78f1e;color:#231f20;font-weight:bold;text-decoration:none">${escape(primary.label)}</a></p>
${secondary ? `<p style="margin:0 0 24px;font-size:16px"><a href="${escape(secondary.url)}" style="color:#231f20;font-weight:bold">${escape(secondary.label)}</a></p>` : ""}
<p style="margin:24px 0 16px;font-size:16px;line-height:1.6">${escape(T1F["T1F-MAIL-SIGNOFF"])}</p>
${footer.map((line) => `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#57524f">${escape(line)}</p>`).join("\n")}
</div></body></html>`;

  return { to: recovery.to, toName: recovery.founderName, subject: T1F[keys.subject], text, html };
}
