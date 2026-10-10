/**
 * The result page's browser events (Event-Log-Spec §4.3): `result_engaged`,
 * sent once per visit in the exit beacon, and `cta_clicked`.
 *
 * Sections are found by `data-track="<name>"`; the upgrade block is
 * `data-track="cta"`. Clickable upgrade links carry `data-cta` and
 * `data-cta-position`.
 */
import { onPageExit, setExitContext, track } from "./client";

export function trackResultPage() {
  const startedAt = Date.now();
  let maxScroll = 0;
  let sent = false;
  const seen = new Set<string>();

  const onScroll = () => {
    const doc = document.documentElement;
    const pct = Math.round(((window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1)) * 100);
    maxScroll = Math.max(maxScroll, Math.min(pct, 100));
  };
  onScroll();

  const observer =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const name = (entry.target as HTMLElement).dataset.track;
              if (entry.isIntersecting && name) seen.add(name);
            }
          },
          // Any part on screen counts: on a phone the upgrade block is taller
          // than several screens, so a share-of-area threshold could never fire.
          { threshold: 0 },
        );
  document.querySelectorAll<HTMLElement>("[data-track]").forEach((el) => observer?.observe(el));

  const onClick = (event: MouseEvent) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-cta]");
    if (target) track("cta_clicked", { cta: target.dataset.cta, position: target.dataset.ctaPosition ?? null });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick);
  const stopContext = setExitContext(() => ({ completed: true }));
  const stopExit = onPageExit(() => {
    if (sent) return;
    sent = true; // One row per visit, not one per tab switch.
    const order = [...document.querySelectorAll<HTMLElement>("[data-track]")].map((el) => el.dataset.track!);
    return [
      {
        type: "result_engaged" as const,
        at: Date.now(),
        payload: {
          max_scroll_pct: maxScroll,
          ms_on_page: Date.now() - startedAt,
          sections_seen: order.filter((name) => seen.has(name)),
          cta_in_viewport: seen.has("cta"),
        },
      },
    ];
  });

  return () => {
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("click", onClick);
    observer?.disconnect();
    stopContext();
    stopExit();
  };
}
