/**
 * "Get your result link again" — Content-Library-Tier1-Find-Result.md v1.0
 * (29 October 2026), copied verbatim, keyed as the library keys them. {date},
 * {founder_name} and {brand} are filled at send time. The WhatsApp messages
 * (§7) wait for the WhatsApp channel and are not here yet.
 */
export const T1F = {
  "T1F-ENTRY-LINK": "Already taken the audit? Get your result link again",

  "T1F-HEAD": "Get your result link again",
  "T1F-SUB": "Enter the email address or mobile number you used. We will send your link there.",
  "T1F-FIELD-LABEL": "Email or mobile",
  "T1F-FIELD-PLACEHOLDER": "you@company.com",
  "T1F-BTN": "Send me the link",
  "T1F-ERR-FORMAT": "That does not look like an email address or a 10-digit mobile number.",
  "T1F-BACK": "Back to the Audit",

  "T1F-SENT-HEAD": "Check your messages",
  "T1F-SENT-BODY": "If we have a result for that address, the link is on its way.",
  "T1F-SENT-FALLBACK":
    "Nothing after a few minutes? You may have used a different address. Write to bd@corpculture.co or WhatsApp +91 8072 830 857 and we will find it.",
  "T1F-RESEND": "Send it again",
  "T1F-RESEND-WAIT": "Already sent. You can try again in a few minutes.",

  "T1F-MAIL-AUDIT-SUBJ": "Your Franchise Readiness Audit result",
  "T1F-MAIL-AUDIT-BODY": "Here is the result you completed on {date}. We keep it for three years from your last activity.",
  "T1F-MAIL-AUDIT-CTA": "Open my result",
  "T1F-MAIL-AUDIT-CTA2": "Continue to the full Report",
  "T1F-MAIL-QUESTIONS-SUBJ": "Your Report — pick up where you left off",
  "T1F-MAIL-QUESTIONS-BODY": "Your order is paid and every answer is saved.",
  "T1F-MAIL-QUESTIONS-CTA": "Continue my questions",
  "T1F-MAIL-WAITING-SUBJ": "Your Report is with Ronak",
  "T1F-MAIL-WAITING-BODY": "Nothing more is needed from you. It comes back within 24 hours on working days.",
  "T1F-MAIL-WAITING-CTA": "Check the status",
  "T1F-MAIL-REPORT-SUBJ": "Your Franchise Readiness Report",
  "T1F-MAIL-REPORT-BODY": "Your Report is ready. The PDF is yours to forward — the link is not.",
  "T1F-MAIL-REPORT-CTA": "Open my Report",

  "T1F-MAIL-GREETING": "Hello {founder_name},",
  "T1F-MAIL-SIGNOFF": "— Corporate Culture",
  "T1F-MAIL-WHYTHIS":
    "You are receiving this because someone asked us to send this link to this address. If that was not you, ignore it — the link opens nothing you did not already have.",
} as const;
