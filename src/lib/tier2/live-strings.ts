/**
 * Strings a Tier 2 library tells us to take from the live product rather than
 * from the library itself.
 *
 * T2S-EMAIL-ERR (Submitted v1.2 §3): "The developer copies the live Audit's
 * email error string from the running page, not from here … the live wording
 * wins and this entry is corrected to match." The live Audit
 * (src/app/audit/ProfileForm.tsx) says the sentence below; the library's own
 * draft differs, and the client has been told to correct the library.
 */
export const AUDIT_EMAIL_ERROR = "Enter a valid email address.";
