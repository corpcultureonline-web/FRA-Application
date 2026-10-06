"use client";

import Link from "next/link";
import { useState } from "react";
import { AuditHeader } from "@/components/AuditHeader";
import { RESULT_STORAGE_KEY, buildResult, type SavedSubmission } from "@/lib/result";
import { useIsBrowser } from "@/lib/useIsBrowser";
import { ResultReport, type InterestState } from "./ResultReport";

function readSubmission(): SavedSubmission | null {
  try {
    const raw = window.localStorage.getItem(RESULT_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<SavedSubmission>) : null;
    // Earlier saves had no server score; they cannot be shown.
    return saved?.version === 2 && saved.score ? (saved as SavedSubmission) : null;
  } catch {
    return null;
  }
}

/** The result is built from the submission saved in this browser at the end of the audit. */
export function ResultView() {
  const isBrowser = useIsBrowser();
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-cream text-ink">
      <AuditHeader />
      {isBrowser ? <Result /> : null}
    </div>
  );
}

function Result() {
  const [submission, setSubmission] = useState(readSubmission);
  const [interest, setInterest] = useState<InterestState>(
    submission?.interested ? "done" : "idle",
  );

  if (!submission) {
    return (
      <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8 lg:py-24">
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">No result to show yet.</h1>
        <p className="mt-3 text-lg leading-relaxed text-body">
          Your result appears here once you finish the audit. It takes about 4 minutes.
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

  const result = buildResult(
    submission.profile,
    submission.answers,
    submission.score,
    new Date(submission.submittedAt),
  );

  async function handleInterested() {
    if (!submission?.id) {
      setInterest({ error: "We could not find your audit. Please write to us instead." });
      return;
    }
    setInterest("saving");
    try {
      const response = await fetch("/api/audit/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submission.id, email: submission.profile.email }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setInterest({ error: body.error ?? "Something went wrong. Please try again." });
        return;
      }
      const updated = { ...submission, interested: true };
      try {
        window.localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      setSubmission(updated);
      setInterest("done");
    } catch {
      setInterest({ error: "Unable to reach the server. Please try again." });
    }
  }

  return <ResultReport result={result} interest={interest} onInterested={handleInterested} />;
}
