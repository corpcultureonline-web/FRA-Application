"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { approveAction, refundAction, returnAction, type ActionState } from "../../../actions";
import styles from "../../../panel.module.css";

export type BarCopy = {
  back: string;
  approve: string;
  approveConfirm: string;
  cancel: string;
  return: string;
  returnLabel: string;
  returnSave: string;
  refund: string;
  refundConfirm: string;
  refundDo: string;
};

type Step = "approve" | "return" | "refund" | null;
const idle: ActionState = { error: null };

/**
 * Screen 9's bar (Admin §3): one filled button, Approve and send; Return and
 * Refund quiet. Each opens a confirm step that names what will happen; one
 * Cancel serves all three. A team login gets no actions at all — absent, not
 * greyed out (§6). The server checks the role again on every action.
 */
export function ReviewBar({
  orderId,
  brand,
  meta,
  copy,
  canApprove,
  canRefund,
}: {
  orderId: number;
  brand: string;
  meta: ReactNode;
  copy: BarCopy;
  canApprove: boolean;
  canRefund: boolean;
}) {
  const [step, setStep] = useState<Step>(null);
  const [approveState, approve, approving] = useActionState(approveAction, idle);
  const [returnState, sendBack, returning] = useActionState(returnAction, idle);
  const [refundState, doRefund, refunding] = useActionState(refundAction, idle);
  const error = approveState.error ?? returnState.error ?? refundState.error;
  const busy = approving || returning || refunding;
  const cancel = (
    <button type="button" className={styles.bt} onClick={() => setStep(null)} disabled={busy}>
      {copy.cancel}
    </button>
  );

  return (
    <>
      <div className={styles.bar2}>
        <Link className={styles.back} href="/manage">
          {copy.back}
        </Link>
        <span className={styles.bn}>{brand}</span>
        <span className={styles.meta}>{meta}</span>
        {(canApprove || canRefund) && (
          <span className={styles.acts}>
            {canRefund && (
              <button type="button" className={styles.bt} onClick={() => setStep("refund")} disabled={busy}>
                {copy.refund}
              </button>
            )}
            {canApprove && (
              <>
                <button type="button" className={styles.bq} onClick={() => setStep("return")} disabled={busy}>
                  {copy.return}
                </button>
                <button type="button" className={styles.b1} onClick={() => setStep("approve")} disabled={busy}>
                  {copy.approve}
                </button>
              </>
            )}
          </span>
        )}
      </div>

      {step === "approve" && canApprove && (
        <form className={styles.confirm} action={approve}>
          <input type="hidden" name="orderId" value={orderId} />
          <span>{copy.approveConfirm}</span>
          <button type="submit" className={styles.b1} disabled={busy}>
            {copy.approve}
          </button>
          {cancel}
        </form>
      )}
      {step === "return" && canApprove && (
        <form className={[styles.confirm, styles.confirm_return].join(" ")} action={sendBack}>
          <input type="hidden" name="orderId" value={orderId} />
          <label>
            {copy.returnLabel}
            <textarea name="note" required />
          </label>
          <button type="submit" className={styles.bq} disabled={busy}>
            {copy.returnSave}
          </button>
          {cancel}
        </form>
      )}
      {step === "refund" && canRefund && (
        <form className={[styles.confirm, styles.confirm_refund].join(" ")} action={doRefund}>
          <input type="hidden" name="orderId" value={orderId} />
          <span>{copy.refundConfirm}</span>
          <button type="submit" className={styles.bq} disabled={busy}>
            {copy.refundDo}
          </button>
          {cancel}
        </form>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
