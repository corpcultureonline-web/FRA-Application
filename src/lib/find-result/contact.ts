import { isValidEmail, normaliseMobile } from "../audit.ts";

/**
 * The one field on /find-my-result takes an email or a mobile (Find-Result
 * library §3). Null is T1F-ERR-FORMAT. An email is compared lower-cased; a
 * mobile as the ten digits the Audit and checkout store.
 */
export type Contact = { kind: "email"; value: string } | { kind: "mobile"; value: string };

export function parseContact(input: string): Contact | null {
  const typed = input.trim();
  if (typed.includes("@")) return isValidEmail(typed) && typed.length <= 320 ? { kind: "email", value: typed.toLowerCase() } : null;
  const mobile = normaliseMobile(typed);
  return mobile ? { kind: "mobile", value: mobile } : null;
}
