"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import styles from "./resume.module.css";

/**
 * The expired link (Resume §4): reassurance first, then one button that sends
 * a fresh link to the address on the order. "Sent" appears only once the
 * server confirms the message actually went.
 */
export function Expired({
  token,
  copy,
}: {
  token: string;
  copy: { head: string; sub: string; button: string; sent: string };
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const send = async () => {
    if (state !== "idle") return;
    setState("sending");
    try {
      const response = await fetch(withBasePath(`/api/resume/${token}/relink`), { method: "POST" });
      setState(response.ok ? "sent" : "idle");
    } catch {
      setState("idle");
    }
  };

  return (
    <main className={styles.main}>
      <h1>{copy.head}</h1>
      <p className={styles.sub}>{copy.sub}</p>
      {state === "sent" ? (
        <p className={styles.sent} role="status">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="#231F20" />
            <path d="M7 12.4l3.2 3.1 6.8-7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {copy.sent}
        </p>
      ) : (
        <button type="button" className={styles.btn} onClick={send} aria-busy={state === "sending"}>
          {copy.button}
          <svg width="16" height="11" viewBox="0 0 18 12" fill="none" aria-hidden="true">
            <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </main>
  );
}
