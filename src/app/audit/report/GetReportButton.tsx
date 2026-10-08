"use client";

import { useState } from "react";

type State = "idle" | "saving" | "done" | { error: string };

/**
 * "Get my full report" while Tier 2 has no page of its own: registers the
 * founder's interest against their report token, so we can invite them when
 * the paid report opens.
 */
export function GetReportButton({
  token,
  interested,
  className,
}: {
  token: string;
  interested: boolean;
  className: string;
}) {
  const [state, setState] = useState<State>(interested ? "done" : "idle");

  async function register() {
    setState("saving");
    try {
      const response = await fetch("/api/audit/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setState({ error: body.error ?? "Something went wrong. Please try again." });
        return;
      }
      setState("done");
    } catch {
      setState({ error: "Unable to reach the server. Please try again." });
    }
  }

  if (state === "done") {
    return (
      <p className="mt-4 rounded-sm bg-[#e3f1e5] px-4 py-3 text-[15px] font-bold text-[#1b4d2b]" role="status">
        ✓ You’re on the list. We’ll invite you as soon as the full report opens.
      </p>
    );
  }

  return (
    <>
      <button type="button" onClick={register} disabled={state === "saving"} className={className}>
        {state === "saving" ? "Saving…" : "Get my full report"}
      </button>
      {typeof state === "object" ? (
        <p className="mt-2 text-sm text-brand-deep" role="alert">
          {state.error}
        </p>
      ) : null}
    </>
  );
}
