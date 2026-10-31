"use client";

import { useActionState, useState } from "react";
import { resendAction } from "../actions";
import styles from "../panel.module.css";

export type ResendCopy = {
  /** T2A-RESEND */
  label: string;
  /** T2A-RESEND-CONFIRM, filled: brand, link type and the live address. */
  confirm: string;
  cancel: string;
  /** T2A-RESEND-DONE / -WAIT / -FAIL, {email} still to fill. */
  done: string;
  wait: string;
  fail: string;
};

/**
 * "Resend their link" (Admin v1.4): a quiet action on every row, never a
 * filled button — Approve stays the only primary. It confirms what will be
 * sent and where before sending, then says what happened.
 */
export function ResendLink({ orderId, copy }: { orderId: number; copy: ResendCopy }) {
  const [open, setOpen] = useState(false);
  const [result, send, sending] = useActionState(resendAction, null);

  if (result && !sending) {
    const said = result.state === "done" ? copy.done : result.state === "wait" ? copy.wait : copy.fail;
    return (
      <span role="status" className={result.state === "fail" ? styles.resendFail : styles.muted}>
        {said.replace("{email}", result.email ?? "")}
      </span>
    );
  }

  if (!open) {
    return (
      <button type="button" className={styles.bt} onClick={() => setOpen(true)}>
        {copy.label}
      </button>
    );
  }

  return (
    <form action={send} className={styles.resend}>
      <input type="hidden" name="orderId" value={orderId} />
      <span>{copy.confirm}</span>
      <button type="submit" className={styles.bq} disabled={sending}>
        {copy.label}
      </button>
      <button type="button" className={styles.bt} onClick={() => setOpen(false)} disabled={sending}>
        {copy.cancel}
      </button>
    </form>
  );
}
