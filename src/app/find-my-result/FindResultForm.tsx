"use client";

import { useState, type FormEvent } from "react";
import { withBasePath } from "@/lib/base-path";
import { parseContact } from "@/lib/find-result/contact";
import { T1F } from "@/lib/find-result/strings";

type State = "form" | "sending" | "sent" | "resending" | "wait" | "failed";

const buttonClass =
  "flex h-14 w-full items-center justify-center rounded-md bg-cta px-8 text-sm font-bold tracking-[0.18em] uppercase transition-colors hover:bg-cta-hover disabled:opacity-60";

/**
 * Find-Result library §3–§4. The link never appears here: the page says the
 * same thing whether or not the contact exists, and a rate-limited resend
 * says so (T1F-RESEND-WAIT) instead of silently doing nothing.
 */
export function FindResultForm() {
  const [typed, setTyped] = useState("");
  const [formatError, setFormatError] = useState(false);
  const [state, setState] = useState<State>("form");

  async function send(next: "sending" | "resending") {
    setState(next);
    try {
      const response = await fetch(withBasePath("/api/find-my-result"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: typed }),
      });
      const result = (await response.json().catch(() => ({}))) as { status?: string; error?: string };
      if (result.error === "format") {
        setFormatError(true);
        setState("form");
      } else if (result.status === "wait") setState("wait");
      else if (result.status === "sent") setState("sent");
      else setState("failed");
    } catch {
      setState("failed");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!parseContact(typed)) {
      setFormatError(true);
      return;
    }
    setFormatError(false);
    void send("sending");
  }

  if (state === "form" || state === "sending" || state === "failed") {
    return (
      <form onSubmit={submit} noValidate className="mt-8 flex flex-col">
        <label htmlFor="contact" className="text-[16px] font-bold">
          {T1F["T1F-FIELD-LABEL"]}
        </label>
        <input
          id="contact"
          type="text"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={T1F["T1F-FIELD-PLACEHOLDER"]}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          aria-invalid={formatError}
          aria-describedby={formatError ? "contact-error" : undefined}
          className={`mt-2.5 h-[52px] w-full rounded-md border bg-white px-4 text-[17px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink ${
            formatError ? "border-brand" : "border-black/20"
          }`}
        />
        {formatError ? (
          <p id="contact-error" className="mt-1.5 text-sm text-brand-deep">
            {T1F["T1F-ERR-FORMAT"]}
          </p>
        ) : null}
        <button type="submit" disabled={state === "sending"} className={`${buttonClass} mt-6`}>
          {T1F["T1F-BTN"]}
        </button>
        {/* The library has no error string for a failed request; its fallback (write to us) is the true thing to say. */}
        {state === "failed" ? (
          <p role="alert" className="mt-4 text-[15px] leading-relaxed text-muted">
            {T1F["T1F-SENT-FALLBACK"]}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="mt-8" aria-live="polite">
      <h2 className="text-2xl font-bold">{T1F["T1F-SENT-HEAD"]}</h2>
      <p className="mt-3 text-[17px] leading-relaxed text-body">{T1F["T1F-SENT-BODY"]}</p>
      {/* Always on screen: a mistyped address sees success and gets nothing, and this is his way out. */}
      <p className="mt-4 text-[15px] leading-relaxed text-muted">{T1F["T1F-SENT-FALLBACK"]}</p>
      {state === "wait" ? <p className="mt-6 text-[15px] font-bold text-brand-deep">{T1F["T1F-RESEND-WAIT"]}</p> : null}
      <button
        type="button"
        onClick={() => void send("resending")}
        disabled={state === "wait" || state === "resending"}
        className={`${buttonClass} mt-6`}
      >
        {T1F["T1F-RESEND"]}
      </button>
    </div>
  );
}
