"use client";

import { useActionState, useState } from "react";
import { Prose } from "@/app/report/my/[token]/report/Prose";
import type { Paragraphs } from "@/lib/report/content";
import { saveEditAction, type ActionState } from "../../../actions";
import styles from "../../../panel.module.css";

export type EditCopy = { edit: string; save: string; cancel: string; edited: string; orig: string; revert: string };

const idle: ActionState = { error: null };

/**
 * One block of the Report, editable in place by an approver (Admin §3). An
 * edited block carries "Edited" for good, and the library's own text stays one
 * click away. Saving the library's words, or restoring them, removes the edit.
 */
export function EditablePiece({
  orderId,
  slot,
  paragraphs,
  original,
  className,
  canEdit,
  copy,
}: {
  orderId: number;
  slot: string;
  /** What the founder will read: the edit if there is one. */
  paragraphs: Paragraphs | null;
  /** The library's version, when the block has been edited. */
  original: Paragraphs | null;
  className: string;
  canEdit: boolean;
  copy: EditCopy;
}) {
  const [editing, setEditing] = useState(false);
  const [showOrig, setShowOrig] = useState(false);
  const [state, save, saving] = useActionState(async (prev: ActionState, form: FormData) => {
    const result = await saveEditAction(prev, form);
    if (!result.error) setEditing(false);
    return result;
  }, idle);
  if (!paragraphs?.length) return null;

  if (editing) {
    return (
      <form className={styles.editor} action={save}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="slot" value={slot} />
        <textarea name="text" defaultValue={paragraphs.join("\n\n")} autoFocus />
        <span className={styles.pieceTools}>
          <button type="submit" className={styles.b1} disabled={saving}>
            {copy.save}
          </button>
          <button type="button" className={styles.bt} onClick={() => setEditing(false)} disabled={saving}>
            {copy.cancel}
          </button>
          {state.error && <span role="alert">{state.error}</span>}
        </span>
      </form>
    );
  }

  return (
    <div className={original ? [styles.piece, styles.pieceEdited].join(" ") : styles.piece}>
      <Prose paragraphs={paragraphs} className={className} />
      {(original || canEdit) && (
        <span className={styles.pieceTools}>
          {original && <span className={styles.edited}>{copy.edited}</span>}
          {canEdit && (
            <button type="button" className={styles.bt} onClick={() => setEditing(true)}>
              {copy.edit}
            </button>
          )}
          {original && (
            <button type="button" className={styles.bt} onClick={() => setShowOrig((v) => !v)}>
              {copy.orig}
            </button>
          )}
          {original && canEdit && (
            <form action={save}>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="slot" value={slot} />
              <input type="hidden" name="restore" value="1" />
              <button type="submit" className={styles.bt} disabled={saving}>
                {copy.revert}
              </button>
            </form>
          )}
          {state.error && <span role="alert">{state.error}</span>}
        </span>
      )}
      {original && showOrig && <Prose paragraphs={original} className={styles.orig} />}
    </div>
  );
}
