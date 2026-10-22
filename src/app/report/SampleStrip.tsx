"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

export type SamplePage = { thumb: StaticImageData; full: StaticImageData; caption: string };

const Arrow = ({ back = false }: { back?: boolean }) => (
  <svg width="16" height="11" viewBox="0 0 18 12" fill="none" aria-hidden="true">
    <path d={back ? "M17 6H2M7 1L2 6l5 5" : "M1 6h15M11 1l5 5-5 5"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Zoom = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * The sample-page strip (HANDOFF §5): four pages, tap to enlarge. The
 * lightbox has previous/next, Esc closes it, and focus returns to the page
 * that opened it. Arrows scroll the strip on desktop; phones swipe.
 */
export function SampleStrip({ pages, hint, labels }: { pages: SamplePage[]; hint: string; labels: { prev: string; next: string; close: string } }) {
  const strip = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [ends, setEnds] = useState({ start: true, end: false });

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const update = () => setEnds({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (direction: 1 | -1) => {
    const el = strip.current;
    const width = el?.querySelector("li")?.getBoundingClientRect().width ?? 300;
    el?.scrollBy({ left: direction * (width + 14), behavior: "smooth" });
  };

  const show = (index: number, button: HTMLButtonElement) => {
    opener.current = button;
    setOpen(index);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onClose = () => {
      setOpen(null);
      opener.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setOpen((i) => (i === null ? i : Math.min(pages.length - 1, i + 1)));
      if (event.key === "ArrowLeft") setOpen((i) => (i === null ? i : Math.max(0, i - 1)));
    };
    el.addEventListener("close", onClose);
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("close", onClose);
      el.removeEventListener("keydown", onKey);
    };
  }, [pages.length]);

  const current = open === null ? null : pages[open];

  return (
    <>
      <div className={styles.stripCtl}>
        <button type="button" className={styles.round} aria-label={labels.prev} disabled={ends.start} onClick={() => scroll(-1)}>
          <Arrow back />
        </button>
        <button type="button" className={styles.round} aria-label={labels.next} disabled={ends.end} onClick={() => scroll(1)}>
          <Arrow />
        </button>
      </div>
      <ul className={styles.strip} ref={strip}>
        {pages.map((page, i) => (
          <li key={page.caption}>
            <button type="button" className={styles.thumb} aria-label={`${i + 1} / ${pages.length} · ${page.caption}`} onClick={(e) => show(i, e.currentTarget)}>
              <span className={styles.frame}>
                <Image src={page.thumb} alt="" sizes="(min-width: 900px) 560px, (min-width: 600px) 420px, 300px" />
                <span className={styles.fade} aria-hidden="true" />
                <span className={styles.zoom} aria-hidden="true">
                  <Zoom />
                </span>
              </span>
              <span className={styles.cap}>
                <span className={styles.no}>
                  {i + 1} / {pages.length}
                </span>
                <span>{page.caption}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.hint}>
        <Zoom />
        <span>{hint}</span>
      </p>

      <dialog ref={dialog} className={styles.lb} aria-label={current?.caption}>
        <div className={styles.lbBar1}>
          <span>{open === null ? "" : `${open + 1} / ${pages.length}`}</span>
          <button type="button" className={styles.ib} aria-label={labels.close} onClick={close}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={styles.lbView}>{current && <Image src={current.full} alt={current.caption} sizes="820px" />}</div>
        <div className={styles.lbBar2}>
          <button type="button" className={styles.ib} aria-label={labels.prev} disabled={!open} onClick={() => setOpen((i) => (i ? i - 1 : 0))}>
            <Arrow back />
          </button>
          <p>{current?.caption}</p>
          <button
            type="button"
            className={styles.ib}
            aria-label={labels.next}
            disabled={open === null || open >= pages.length - 1}
            onClick={() => setOpen((i) => (i === null ? i : Math.min(pages.length - 1, i + 1)))}
          >
            <Arrow />
          </button>
        </div>
      </dialog>
    </>
  );
}
