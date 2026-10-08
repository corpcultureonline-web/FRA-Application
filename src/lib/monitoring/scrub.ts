/**
 * Strips personal data and secrets from an error event before it leaves the
 * server or browser (Response to the Tech Stack Audit §1.3).
 *
 * Sentry may know a submission_id and nothing else about a brand: never a
 * name, email, mobile, brand name, questionnaire body, report token or key.
 * Pure — no Sentry import — so it is tested on its own.
 */

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
/** 10–15 digit runs with single spaces/dashes — mobiles, not dates or line numbers. */
const PHONE = /(?<![\w.])\+?\d(?:[\s-]?\d){9,14}(?![\w.])/g;
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;
/** Report tokens (32 hex) and other long hex secrets. */
const HEX_TOKEN = /\b[0-9a-f]{24,}\b/gi;
/** user:password@ in connection strings. */
const URL_CREDENTIALS = /(\w+:\/\/)[^\s:@/]+:[^\s@/]+@/g;

/** Sentry's own identifiers — hex by design, and needed to group and trace events. */
const KEEP_KEYS = new Set(["event_id", "trace_id", "span_id", "parent_span_id", "release", "dist", "debug_id"]);

/** Env values that must never appear in an event, whatever the error object carried. */
const SECRET_ENV = [
  "DATABASE_URL",
  "ZOHO_CLIENT_ID",
  "ZOHO_CLIENT_SECRET",
  "ZOHO_REFRESH_TOKEN",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "ZEPTOMAIL_TOKEN",
  "SMTP_PASSWORD",
];

/** Keys dropped wherever they appear: they hold people, bodies or credentials. */
const DROP_KEYS = new Set([
  "user",
  "cookies",
  "headers",
  "data",
  "query_string",
  "body",
  "authorization",
  "cookie",
  "email",
  "phone",
  "brandName",
  "brand_name",
  "founderName",
  "founder_name",
  "profile",
  "answers",
]);

function secretValues(env: Record<string, string | undefined>) {
  return SECRET_ENV.map((key) => env[key]?.trim()).filter((value): value is string => Boolean(value && value.length >= 6));
}

export function scrubText(text: string, secrets: string[] = []) {
  let out = text;
  for (const secret of secrets) out = out.split(secret).join("[secret]");
  return out
    .replace(URL_CREDENTIALS, "$1[credentials]@")
    .replace(EMAIL, "[email]")
    .replace(HEX_TOKEN, "[token]")
    .replace(PHONE, (match) => (DATE_PREFIX.test(match) ? match : "[number]"));
}

function scrubValue(value: unknown, secrets: string[], depth: number): unknown {
  if (typeof value === "string") return scrubText(value, secrets);
  if (depth > 12 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, secrets, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (DROP_KEYS.has(key)) continue;
    out[key] = KEEP_KEYS.has(key) ? inner : scrubValue(inner, secrets, depth + 1);
  }
  return out;
}

/**
 * Returns a scrubbed copy of a Sentry event or breadcrumb. Works on any
 * JSON-like object, so it needs no Sentry types.
 */
export function scrubEvent<T>(event: T, env: Record<string, string | undefined> = process.env): T {
  return scrubValue(event, secretValues(env), 0) as T;
}
