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

const SEPARATOR = /^\|[\s:|-]+\|$/;

const tableCells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

export function parseLibraryKeys(markdown: string): Map<string, string> {
  const strings = new Map<string, string>();
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  // The column headed "Copy" in the current table; tables without one (the
  // two-column `| Key | Reads |` kind) keep their copy in the last cell.
  let copyColumn = -1;
  lines.forEach((line, i) => {
    if (!line.startsWith("|")) {
      copyColumn = -1;
      return;
    }
    if (SEPARATOR.test(line.trim())) {
      copyColumn = tableCells(lines[i - 1] ?? "").findIndex((cell) => /^copy$/i.test(cell));
      return;
    }
    const cells = tableCells(line);
    const keyIndex = cells.findIndex((cell) => KEY_CELL.test(cell));
    const copyIndex = copyColumn > keyIndex ? copyColumn : cells.length - 1;
    if (keyIndex === -1 || keyIndex >= copyIndex) return;
    const key = KEY_CELL.exec(cells[keyIndex])![1];
    const copy = (cells[copyIndex] ?? "").replace(NOTE, "");
    if (!copy || POINTER.test(copy) || strings.has(key)) return;
    strings.set(key, copy);
  });
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
