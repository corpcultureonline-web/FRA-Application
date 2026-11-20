/**
 * Identity and lifecycle rules (Developer-Handoff-Identity-Attribution, 20 Nov
 * 2026, §5 and §7). Pure, so they are tested without a database.
 */
import { createHash } from "node:crypto";

/** §5.1, in order. Each state is a superset of the one before; Visitor has no person row. */
export const STATES = ["user", "participant", "customer", "client"] as const;
export type State = (typeof STATES)[number];

/** True only when `to` is further along than `from`: states never move back. */
export function isForward(from: string | null, to: State) {
  const fromRank = from ? STATES.indexOf(from as State) : -1;
  return STATES.indexOf(to) > fromRank;
}

export type StatusFlags = {
  stalled_at_section?: number;
  upgrade_clicked_unpaid?: boolean;
  paid_questions_incomplete?: boolean;
};

/**
 * The flags a state change settles (§5.2): a Participant has not stalled, a
 * Customer has paid (so the upgrade click is no longer unpaid) and has not yet
 * finished the questions, and a Client's questions are done.
 */
export function flagsOnEntering(state: State): { set: StatusFlags; clear: (keyof StatusFlags)[] } {
  switch (state) {
    case "participant":
      return { set: {}, clear: ["stalled_at_section"] };
    case "customer":
      return { set: { upgrade_clicked_unpaid: false, paid_questions_incomplete: true }, clear: ["stalled_at_section"] };
    case "client":
      return { set: { paid_questions_incomplete: false }, clear: [] };
    default:
      return { set: {}, clear: [] };
  }
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * E.164 for an Indian mobile: the Audit stores ten digits, without +91. Any
 * other shape is normalised as far as it safely can be, so the same number on
 * two devices always hashes the same (§7).
 */
export function normalisePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  return digits ? `+${digits}` : null;
}

export function normaliseEmail(email: string) {
  const value = email.trim().toLowerCase();
  return value || null;
}

export function contactHashes(contact: { phone?: string | null; email?: string | null }) {
  const phone = contact.phone ? normalisePhone(contact.phone) : null;
  const email = contact.email ? normaliseEmail(contact.email) : null;
  return { phoneHash: phone ? sha256(phone) : null, emailHash: email ? sha256(email) : null };
}
