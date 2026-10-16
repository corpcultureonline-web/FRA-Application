import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseLegalMarkdown, type Block } from "./markdown";

/**
 * The date at the top of all three legal pages ({{LEGAL_LAST_UPDATED}} in the
 * documents). Set once, to the day the pages go live, as a fixed string —
 * never today's date at request time: Privacy §13 and Terms §14 tell the reader
 * this is when the document last changed. Until it is set the page shows the
 * token itself, so an unset date cannot pass unnoticed.
 */
export const LEGAL_LAST_UPDATED: string | null = null;

export type LegalSlug = "privacy" | "terms" | "refunds";

/**
 * The three pages, at the app-level routes in CANONICAL-VALUES §4. Shared by
 * the Audit, the Report and the Roadmap; the footer links between them in this
 * order. Labels are the documents' own titles.
 */
export const LEGAL_PAGES: { slug: LegalSlug; label: string }[] = [
  { slug: "privacy", label: "Privacy Policy" },
  { slug: "terms", label: "Terms & Conditions" },
  { slug: "refunds", label: "Refund Policy" },
];

function readLegal(slug: LegalSlug) {
  return readFileSync(path.join(process.cwd(), "src", "content", "legal", `${slug}.md`), "utf8");
}

/** src/content/legal/<slug>.md — the published text, copied verbatim from the source library. */
export function loadLegalDocument(slug: LegalSlug): Block[] {
  return parseLegalMarkdown(readLegal(slug));
}

/**
 * The version of each document now published, from the source file's version
 * line recorded in the copy's first line. Stored with every order's consent
 * (T75), so we can say which version a customer accepted.
 */
export function legalVersions(): Record<LegalSlug, string> {
  const version = (slug: LegalSlug) => {
    const match = /Version ([0-9.]+)/.exec(readLegal(slug).split("\n")[0]);
    if (!match) throw new Error(`${slug}.md has no version line`);
    return match[1];
  };
  return { terms: version("terms"), privacy: version("privacy"), refunds: version("refunds") };
}

export function legalTitle(slug: LegalSlug) {
  return LEGAL_PAGES.find((page) => page.slug === slug)!.label;
}
