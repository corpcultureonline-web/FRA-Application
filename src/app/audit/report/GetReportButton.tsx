"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { withBasePath } from "@/lib/base-path";

type State = "idle" | "saving" | "done" | { error: string };

async function postInterest(body: Record<string, string>) {
  const response = await fetch(withBasePath("/api/audit/interest"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) return null;
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  return payload.error ?? "Something went wrong. Please try again.";
}

/**
 * "Get my full report" while Tier 2 has no checkout: records the founder's
 * interest against their report token (MySQL, then Zoho, which notifies the
 * team), then offers one optional field for a mobile number (Content Library §20).
 */
export function GetReportButton({
  token,
  interested,
  phoneGiven,
  className,
  label = "Get my full report",
}: {
  token: string;
  interested: boolean;
  phoneGiven: boolean;
  className: string;
  label?: ReactNode;
}) {
  const [state, setState] = useState<State>(interested ? "done" : "idle");

  async function register() {
    setState("saving");
    try {
      const error = await postInterest({ token });
      setState(error ? { error } : "done");
    } catch {
      setState({ error: "Unable to reach the server. Please try again." });
    }
  }

  if (state === "done") return <Confirmation token={token} phoneGiven={phoneGiven} />;

  return (
    <>
      <button type="button" onClick={register} disabled={state === "saving"} className={className}>
        {state === "saving" ? "Saving…" : label}
      </button>
      {typeof state === "object" ? (
        <p className="mt-2 text-sm text-brand-deep" role="alert">
          {state.error}
        </p>
      ) : null}
    </>
  );
}

function Confirmation({ token, phoneGiven }: { token: string; phoneGiven: boolean }) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<State>(phoneGiven ? "done" : "idle");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone.trim()) return;
    setState("saving");
    try {
      const error = await postInterest({ token, phone });
      setState(error ? { error } : "done");
    } catch {
      setState({ error: "Unable to reach the server. Please try again." });
    }
  }

  return (
    <div className="mt-4 rounded-sm bg-[#e3f1e5] px-4 py-4 text-[15px] text-[#1b4d2b]" role="status">
      <p>
        <strong>You’re on the list.</strong> We will be in touch within one working day.
      </p>
      {state === "done" ? (
        phoneGiven ? null : <p className="mt-2">Thank you — we will call you back.</p>
      ) : (
        <form onSubmit={save} className="mt-3">
          <label htmlFor="tier2-phone" className="block text-[14px]">
            Mobile number (optional) — so we can call you back instead of emailing.
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="tier2-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-sm border border-black/15 bg-white px-3 text-ink"
            />
            <button
              type="submit"
              disabled={state === "saving" || !phone.trim()}
              className="h-10 rounded-sm bg-[#1b4d2b] px-4 font-bold text-white disabled:opacity-60"
            >
              {state === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
          {typeof state === "object" ? (
            <p className="mt-2 text-sm text-brand-deep" role="alert">
              {state.error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
