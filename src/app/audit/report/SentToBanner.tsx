"use client";

import { RESULT_STORAGE_KEY, type SavedSubmission } from "@/lib/result";
import { useIsBrowser } from "@/lib/useIsBrowser";

function savedEmail(token: string) {
  try {
    const raw = window.localStorage.getItem(RESULT_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<SavedSubmission>) : null;
    return saved?.reportToken === token ? (saved.profile?.email ?? null) : null;
  } catch {
    return null;
  }
}

/**
 * "A copy of this result has been sent to …" — only in the browser that took
 * the audit, so a forwarded result link never shows the founder's email.
 */
export function SentToBanner({ token }: { token: string }) {
  const isBrowser = useIsBrowser();
  const email = isBrowser ? savedEmail(token) : null;
  if (!email) return null;

  return (
    <p className="mt-5 inline-flex items-start gap-2.5 rounded-md bg-[#e3f1e5] px-4 py-3 text-[15px] text-[#1b4d2b]">
      <span aria-hidden="true" className="font-bold">
        ✓
      </span>
      <span>
        A copy of this result has been sent to <strong className="[overflow-wrap:anywhere]">{email}</strong>.
      </span>
    </p>
  );
}
