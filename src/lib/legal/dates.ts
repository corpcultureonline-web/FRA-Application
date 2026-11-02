import type { LegalSlug } from "./documents";

/**
 * The date at the top of each legal page ({{LEGAL_LAST_UPDATED}} in the
 * documents): the day that document's own text last changed, the date on the
 * version line of the copy published (T179, superseding T87's one shared
 * deploy date). A fixed string, never today's date at request time: Privacy
 * §13 and Terms §14 tell the reader this is when the document last changed.
 * Change a date only with that document's text; a test holds each to its
 * source's version line.
 */
export const LEGAL_LAST_UPDATED: Record<LegalSlug, string> = {
  privacy: "1 November 2026",
  terms: "30 October 2026",
  refunds: "16 October 2026",
};
