"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuditHeader } from "@/components/AuditHeader";
import { RESULT_STORAGE_KEY, type SavedSubmission } from "@/lib/result";
import { useIsBrowser } from "@/lib/useIsBrowser";

function readToken(): string | null {
  try {
    const raw = window.localStorage.getItem(RESULT_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<SavedSubmission>) : null;
    return saved?.reportToken ?? null;
  } catch {
    return null;
  }
}

/**
 * The result lives at /audit/report/<token>, rebuilt from MySQL — the same
 * page the PDF prints. This route forwards the browser that took the audit.
 */
export function ResultView() {
  const isBrowser = useIsBrowser();
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-cream text-ink">
      <AuditHeader />
      {isBrowser ? <Forward /> : null}
    </div>
  );
}

function Forward() {
  const router = useRouter();
  const token = readToken();

  useEffect(() => {
    if (token) router.replace(`/audit/report/${token}`);
  }, [router, token]);

  if (token) return null;

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8 lg:py-24">
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">No result to show yet.</h1>
      <p className="mt-3 text-lg leading-relaxed text-body">
        Your result appears here once you finish the audit. It takes about 4 minutes. If you have already taken
        it, use the report link in your email.
      </p>
      <Link
        href="/audit"
        className="mt-8 inline-flex h-14 items-center justify-center gap-3 rounded-md bg-cta px-9 text-sm font-bold tracking-[0.18em] uppercase hover:bg-cta-hover"
      >
        Start the audit <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}
