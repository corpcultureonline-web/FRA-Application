import "server-only";

/**
 * Transactional email through Zoho ZeptoMail (Messages v1.2 §11; decision T8),
 * on Zoho's India data centre. From bd@corpculture.co as "Corporate Culture",
 * and replies reach that same inbox — a person reads it (§1: no "do not reply").
 *
 * Off until ZEPTOMAIL_TOKEN is set. Sending then throws EmailUnavailable, so a
 * caller can never report a message as sent when it was not.
 */
const API = "https://api.zeptomail.in/v1.1/email";
const FROM = { address: "bd@corpculture.co", name: "Corporate Culture" };

export class EmailUnavailable extends Error {}

export type Email = { to: string; toName?: string; subject: string; text: string; html: string };

export function emailConfigured() {
  return Boolean(process.env.ZEPTOMAIL_TOKEN);
}

export async function sendEmail(email: Email) {
  const token = process.env.ZEPTOMAIL_TOKEN;
  if (!token) throw new EmailUnavailable("ZEPTOMAIL_TOKEN is not configured.");
  const response = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: token.startsWith("Zoho-enczapikey") ? token : `Zoho-enczapikey ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      reply_to: [FROM],
      to: [{ email_address: { address: email.to, name: email.toName ?? "" } }],
      subject: email.subject,
      textbody: email.text,
      htmlbody: email.html,
      track_clicks: false,
      track_opens: false,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`ZeptoMail send failed (${response.status}): ${body.slice(0, 300)}`);
  }
}
