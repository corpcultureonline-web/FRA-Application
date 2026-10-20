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
export const LEGAL_LAST_UPDATED: string | null = "20 October 2026";

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

/**
 * The policies listed in the legal pages' footer. The Refund Policy page is
 * live (the Terms link to it) but stays out of the footer until the Report
 * can be bought — add "refunds" back here on launch day.
 */
export const FOOTER_POLICIES: LegalSlug[] = ["privacy", "terms"];

/** src/content/legal/<slug>.md — the published text, copied verbatim from the source library. */
export function loadLegalDocument(slug: LegalSlug): Block[] {
  const file = path.join(process.cwd(), "src", "content", "legal", `${slug}.md`);
  return parseLegalMarkdown(readFileSync(file, "utf8"));
}

export function legalTitle(slug: LegalSlug) {
  return LEGAL_PAGES.find((page) => page.slug === slug)!.label;
}
