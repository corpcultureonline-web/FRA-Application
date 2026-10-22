"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./landing.module.css";

/**
 * The sticky price bar (HANDOFF §5): below 900px only, shown once the
 * opening's button has scrolled away, hidden while the price card is on
 * screen so the two never sit together.
 */
export function StickyBar({ label, children }: { label: string; children: ReactNode }) {
  const [heroGone, setHeroGone] = useState(false);
  const [priceIn, setPriceIn] = useState(false);

  useEffect(() => {
    const opening = document.getElementById("opening");
    const price = document.getElementById("price");
    if (!opening || !price) return;
    const hero = new IntersectionObserver(([entry]) => setHeroGone(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    const card = new IntersectionObserver(([entry]) => setPriceIn(entry.isIntersecting), { threshold: 0.15 });
    hero.observe(opening);
    card.observe(price);
    return () => {
      hero.disconnect();
      card.disconnect();
    };
  }, []);

  const show = heroGone && !priceIn;
  return (
    <div className={show ? [styles.sticky, styles.stickyShow].join(" ") : styles.sticky} role="region" aria-label={label} aria-hidden={!show} inert={!show}>
      {children}
    </div>
  );
}
