/**
 * The help page's structure, read from Content-Library-Tier2-Help-Page.md:
 * its seven section headings are the library's own "### Section n — …" titles,
 * which the board prints verbatim (they carry no key), and the escape rows pair
 * the label he saw with the key that explains it. Pure.
 */
export function parseHelpHeadings(markdown: string): string[] {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .flatMap((line) => {
      const match = /^### Section \d+ — (.+)$/.exec(line);
      return match ? [match[1].trim()] : [];
    });
}

/** "| We don't have a Google listing | `T2HP-ESC-GOOGLE` | …" → [label, key]. */
export function parseEscapeRows(markdown: string): { label: string; key: string }[] {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .flatMap((line) => {
      const match = /^\| ([^|`]+?) \| `(T2HP-ESC-[A-Z]+)` \|/.exec(line);
      return match ? [{ label: match[1].trim(), key: match[2] }] : [];
    });
}
