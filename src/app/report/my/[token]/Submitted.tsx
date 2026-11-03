"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import logo from "@/assets/logo.png";
import ronak from "@/assets/tier2/ronak-patel.png";
import { withBasePath } from "@/lib/base-path";
import styles from "./submitted.module.css";

export type SubmittedCopy = {
  head: string;
  sub: string;
  reviewer: string;
  when: string;
  still: string;
  whereLabel: string;
  wherePhone: string;
  change: string;
  closeOk: string;
  emailLabel: string;
  phoneLabel: string;
  save: string;
  cancel: string;
  done: string;
  phoneErr: string;
  emailErr: string;
  a11yEmail: string;
  a11yPhone: string;
  readyHead: string;
  readyBtn: string;
  entity: string;
};

type Field = "email" | "mobile";

/** "9876543210" → "+91 98765 43210", as on the board. */
const showMobile = (mobile: string) => `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;

function Done() {
  return (
    <span className={styles.done} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4.5 10.4l3.6 3.4 7.4-7.6" stroke="#231F20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.errIcon}>
      <circle cx="8" cy="8" r="6.5" stroke="#B8360F" strokeWidth="1.5" />
      <path d="M8 4.6v4.2" stroke="#B8360F" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r=".9" fill="#B8360F" />
    </svg>
  );
}

/**
 * Screen 5, Submitted (library v1.2). One job: make the wait feel safe. It
 * names the reviewer, says when the Report comes back, and shows both
 * addresses it will go to, each correctable in place (§3). The same link, once
 * the Report is sent, is replaced by "Your Report is ready" (§4).
 */
export function Submitted({
  token,
  arrived,
  ready,
  email: initialEmail,
  mobile: initialMobile,
  copy,
}: {
  token: string;
  /** Came here from Finish and send; otherwise he has returned while it is still with Ronak. */
  arrived: boolean;
  ready: boolean;
  email: string;
  mobile: string;
  copy: SubmittedCopy;
}) {
  const [values, setValues] = useState({ email: initialEmail, mobile: initialMobile });
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState<Field | null>(null);

  const header = (
    <header className={styles.bar}>
      <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
    </header>
  );
  const footer = <p className={styles.foot}>{copy.entity}</p>;

  // §4: the ready state replaces the whole page — no waiting copy left behind.
  if (ready) {
    return (
      <div className={styles.page}>
        {header}
        <main className={styles.main}>
          <div className={styles.card}>
            <Done />
            <h1>{copy.readyHead}</h1>
            <a className={styles.btn} href={withBasePath(`/report/my/${token}/report`)}>
              {copy.readyBtn}
              <svg width="16" height="11" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </main>
        {footer}
      </div>
    );
  }

  const open = (field: Field) => {
    setEditing(field);
    setDraft(field === "email" ? values.email : values.mobile);
    setError(false);
    setJustSaved(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    try {
      const response = await fetch(withBasePath(`/api/runs/${token}/delivery`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editing]: draft }),
      });
      const body = (await response.json()) as { value?: string; error?: string };
      if (response.ok && body.value) {
        setValues((current) => ({ ...current, [editing]: body.value! }));
        setJustSaved(editing);
        setEditing(null);
      } else if (body.error === "sent") {
        window.location.reload();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setSaving(false);
  };

  const row = (field: Field) => {
    const isEmail = field === "email";
    if (editing === field) {
      return (
        <form className={styles.edit} onSubmit={save} noValidate>
          <label htmlFor={`change-${field}`}>{isEmail ? copy.emailLabel : copy.phoneLabel}</label>
          <div className={`${styles.field} ${error ? styles.bad : ""}`}>
            {!isEmail && <span className={styles.pre}>+91</span>}
            <input
              id={`change-${field}`}
              type={isEmail ? "email" : "tel"}
              inputMode={isEmail ? "email" : "numeric"}
              autoComplete={isEmail ? "email" : "tel-national"}
              value={draft}
              autoFocus
              aria-invalid={error}
              aria-describedby={error ? `change-${field}-err` : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(false);
              }}
            />
          </div>
          {error && (
            <p className={styles.err} id={`change-${field}-err`}>
              <ErrorIcon />
              {isEmail ? copy.emailErr : copy.phoneErr}
            </p>
          )}
          <div className={styles.acts}>
            <button type="submit" className={styles.save} aria-busy={saving}>
              {copy.save}
            </button>
            <button type="button" className={styles.cancel} onClick={() => setEditing(null)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      );
    }
    return (
      <div className={`${styles.row} ${justSaved === field ? styles.rowSaved : ""}`}>
        <span className={styles.ic} aria-hidden="true">
          {isEmail ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 5.5l7 5.5 7-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3a7 7 0 0 0-6.1 10.4L3 17l3.7-.9A7 7 0 1 0 10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <p className={styles.v}>
          {isEmail ? (
            values.email
          ) : (
            <>
              {copy.wherePhone.split("{mobile}")[0]}
              {showMobile(values.mobile)}
              <small>{copy.wherePhone.split("{mobile}")[1]}</small>
            </>
          )}
          {justSaved === field && (
            <span className={styles.ok} role="status">
              {" "}
              {copy.done}
            </span>
          )}
        </p>
        <button
          type="button"
          className={styles.chg}
          aria-label={isEmail ? copy.a11yEmail : copy.a11yPhone}
          onClick={() => open(field)}
        >
          {copy.change}
        </button>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {header}
      <main className={styles.main}>
        <div className={styles.card}>
          <Done />
          <div className={styles.headGroup}>
            <h1>{copy.head}</h1>
            <p className={styles.sub}>{copy.sub}</p>
          </div>
          <div className={styles.rev}>
            <Image src={ronak} alt="" unoptimized className={styles.portrait} />
            <p>{copy.reviewer}</p>
          </div>
          {/* §6: returning while it is still with Ronak, the one line changes. */}
          <p className={styles.when}>{arrived ? copy.when : copy.still}</p>
          <div className={styles.where}>
            <p className={styles.lab}>{copy.whereLabel}</p>
            {row("email")}
            {row("mobile")}
          </div>
          <p className={styles.close}>{copy.closeOk}</p>
        </div>
      </main>
      {footer}
    </div>
  );
}
