"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * An accordion on small screens; on md+ every answer is always visible, as in
 * the desktop design, and the toggle is hidden.
 */
export function FaqItem({
  question,
  children,
  defaultOpen = false,
}: {
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const answerId = useId();

  return (
    <div className="border-t border-black/10 py-5 md:pt-8 md:pb-12">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={answerId}
          className="flex w-full items-center justify-between gap-4 text-left text-lg font-bold text-ink md:pointer-events-none"
        >
          {question}
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-ink/60 text-base leading-none md:hidden"
          >
            {open ? "–" : "+"}
          </span>
        </button>
      </h3>
      <div
        id={answerId}
        className={`${open ? "block" : "hidden"} mt-4 leading-[1.8] text-body md:mt-3 md:block`}
      >
        {children}
      </div>
    </div>
  );
}
