"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../panel.module.css";

export function PanelNav({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  const current = (href: string) => (href === "/manage" ? path === "/manage" || path.startsWith("/manage/reports") : path.startsWith(href));
  return (
    <nav className={styles.nav}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={current(link.href) ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
