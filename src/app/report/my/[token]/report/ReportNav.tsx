"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import styles from "./report.module.css";

type Head = { number: string; title: string | null };

export type NavCopy = { contents: string; close: string; top: string };

/**
 * The contents as navigation (Report library §5): on a phone, a bar pinned
 * once the inline list scrolls away, naming the current section and opening
 * the list as a sheet; on desktop, a sticky rail. It also times how long each
 * section is the one being read, for report_section_read (§8), sent by
 * beacon when the page is hidden.
 */
export function ReportNav({ token, sections, copy }: { token: string; sections: Head[]; copy: NavCopy }) {
  const [current, setCurrent] = useState<string>(sections[0]?.number ?? "");
  const [pinned, setPinned] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const reading = useRef<{ section: string; since: number } | null>(null);
  const totals = useRef<Record<string, number>>({});

  useEffect(() => {
    const elements = sections
      .map((s) => document.querySelector<HTMLElement>(`[data-section="${s.number}"]`))
      .filter((el): el is HTMLElement => el !== null);
    const visible = new Map<string, number>();

    const settle = (now: number) => {
      const open = reading.current;
      if (open && document.visibilityState === "visible") {
        totals.current[open.section] = (totals.current[open.section] ?? 0) + (now - open.since);
      }
    };
    const switchTo = (section: string | null) => {
      const now = performance.now();
      settle(now);
      reading.current = section ? { section, since: now } : null;
      if (section) setCurrent(section);
    };

    // The current section is the topmost one crossing the upper third of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const section = (entry.target as HTMLElement).dataset.section!;
          if (entry.isIntersecting) visible.set(section, entry.boundingClientRect.top);
          else visible.delete(section);
        }
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]?.[0] ?? null;
        if (top !== reading.current?.section) switchTo(top);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    elements.forEach((el) => observer.observe(el));

    const contents = document.getElementById("contents");
    const pin = new IntersectionObserver(([entry]) => setPinned(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    if (contents) pin.observe(contents);

    const send = () => {
      settle(performance.now());
      if (reading.current) reading.current.since = performance.now();
      const sectionsRead = Object.fromEntries(Object.entries(totals.current).filter(([, ms]) => ms >= 1000));
      totals.current = {};
      if (Object.keys(sectionsRead).length) {
        navigator.sendBeacon?.(withBasePath(`/api/runs/${token}/report-event`), JSON.stringify({ type: "sections", sections: sectionsRead }));
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") send();
      else if (reading.current) reading.current.since = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", send);
    return () => {
      observer.disconnect();
      pin.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", send);
    };
  }, [sections, token]);

  const currentTitle = sections.find((s) => s.number === current);
  const link = (s: Head, className: string, currentClass: string) => (
    <a
      key={s.number}
      href={`#s${s.number}`}
      className={`${className} ${s.number === current ? currentClass : ""}`}
      aria-current={s.number === current ? "location" : undefined}
      onClick={() => sheet.current?.close()}
    >
      <span className={styles.n}>{s.number}</span>
      <span>{s.title}</span>
    </a>
  );

  return (
    <>
      <nav className={styles.rail} aria-label={copy.contents}>
        <span className={`${styles.mono} ${styles.eye}`}>{copy.contents}</span>
        {sections.map((s) => link(s, styles.railLink, styles.railCur))}
        <a className={styles.top} href="#top">
          {copy.top}
        </a>
      </nav>

      <div className={`${styles.sticky} ${pinned ? styles.stickyOn : ""}`} aria-hidden={!pinned}>
        <div className={styles.cur}>
          <span className={styles.n}>{currentTitle?.number}</span>
          <span>{currentTitle?.title}</span>
        </div>
        <button type="button" className={styles.tocbtn} tabIndex={pinned ? 0 : -1} onClick={() => sheet.current?.showModal()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {copy.contents}
        </button>
      </div>

      <dialog ref={sheet} className={styles.sheet} aria-label={copy.contents} onClick={(e) => e.target === sheet.current && sheet.current.close()}>
        <span className={styles.grab} aria-hidden="true" />
        <div className={styles.sheetHead}>
          <span className={`${styles.mono} ${styles.eye}`}>{copy.contents}</span>
          <button type="button" className={styles.x} aria-label={copy.close} onClick={() => sheet.current?.close()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {sections.map((s) => link(s, styles.tocLink, styles.tocCur))}
        <a className={styles.top} href="#top" onClick={() => sheet.current?.close()}>
          {copy.top}
        </a>
      </dialog>
    </>
  );
}

/**
 * "Tell me about the Roadmap" (T127): no route — it registers interest and
 * `T2R-CTA-DONE` replaces it in place, with no navigation and no scroll. The
 * confirmation shows only once the server has saved the interest.
 */
export function RoadmapInterest({
  token,
  label,
  done,
  registered,
  className,
  doneClassName,
}: {
  token: string;
  label: React.ReactNode;
  done: React.ReactNode;
  registered: boolean;
  className: string;
  doneClassName: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done">(registered ? "done" : "idle");
  if (state === "done") {
    return (
      <p className={doneClassName} role="status">
        {done}
      </p>
    );
  }
  const register = async () => {
    setState("sending");
    try {
      const response = await fetch(withBasePath(`/api/runs/${token}/roadmap-interest`), { method: "POST" });
      setState(response.ok ? "done" : "idle");
    } catch {
      setState("idle");
    }
  };
  return (
    <button type="button" className={className} onClick={register} disabled={state === "sending"} aria-busy={state === "sending"}>
      {label}
    </button>
  );
}
