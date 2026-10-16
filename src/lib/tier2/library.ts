/**
 * Reads Tier 2 strings out of the content libraries' key tables. Every string
 * on a Tier 2 screen carries a key (`T2C-HEAD`), and `keys.json` names the one
 * library that owns it. The words are taken from that file's table as written:
 * nothing is retyped into code (START-HERE-Developer §1, AUTHORITIES §5).
 *
 * A key row looks like `| \`T2C-HEAD\` | Complete your purchase |`, sometimes
 * with a design placeholder or a pair column before the key. The copy is the
 * last cell. Notes the library adds to a cell in italic parentheses, such as
 * `*(link)*`, are about the string, not part of it, and are dropped.
 */

const KEY_CELL = /^`(T2[A-Z]*-[A-Z0-9-]+)`$/;
/** "Refund policy *(link)*" → "Refund policy". */
const NOTE = /\s*\*\([^)]*\)\*\s*$/;
/** A cell that points elsewhere ("*§3.1 above*") rather than holding copy. */
const POINTER = /^\*§/;

export function parseLibraryKeys(markdown: string): Map<string, string> {
  const strings = new Map<string, string>();
  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
    const keyIndex = cells.findIndex((cell) => KEY_CELL.test(cell));
    if (keyIndex === -1 || keyIndex === cells.length - 1) continue;
    const key = KEY_CELL.exec(cells[keyIndex])![1];
    const copy = cells.at(-1)!.replace(NOTE, "");
    if (!copy || POINTER.test(copy) || strings.has(key)) continue;
    strings.set(key, copy);
  }
  return strings;
}

export type Segment = { text: string; strong: boolean };

/** Splits **bold** markup, which the libraries use for emphasis and for link labels. */
export function segments(copy: string): Segment[] {
  return copy
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), strong: true }
        : { text: part, strong: false },
    );
}

/** The string as plain text, markup removed. */
export function plain(copy: string) {
  return segments(copy)
    .map((segment) => segment.text)
    .join("");
}
