/**
 * The small Markdown subset the three legal documents are written in
 * (Privacy-Policy.md, Terms-and-Conditions.md, Refund-Policy.md §A), parsed to
 * blocks the legal template renders. Only what those files use: headings,
 * paragraphs, bullet and numbered lists, pipe tables, bold, italic, links and
 * code spans. Anything else is a change to the documents and should fail a test
 * rather than render oddly.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "b"; c: Inline[] }
  | { t: "i"; c: Inline[] }
  | { t: "a"; href: string; c: Inline[] }
  | { t: "code"; v: string };

export type Block =
  /** The document's own title, the first heading in the file. */
  | { t: "title"; text: string }
  /** h2: `n` is the clause number where the document numbers its sections. */
  | { t: "section"; n: string | null; text: string }
  | { t: "subsection"; text: string }
  /** Each source line of the paragraph, rendered with a line break between. */
  | { t: "p"; lines: Inline[][] }
  | { t: "list"; ordered: boolean; items: Inline[][] }
  /** A two-column table with an empty header row: label and value pairs. */
  | { t: "kv"; rows: { label: Inline[]; value: Inline[] }[] }
  | { t: "table"; head: Inline[][]; rows: Inline[][][] }
  /** The "Last updated" line; `label` is its wording, the date is set at deploy. */
  | { t: "updated"; label: string };

/** The deploy-time date token shared by all three documents. */
export const DATE_TOKEN = "{{LEGAL_LAST_UPDATED}}";

const UPDATED = /^\*(.+?)\*\*\{\{LEGAL_LAST_UPDATED\}\}\*\*\*$/;
const HEADING = /^(#{1,6}) (.+)$/;
const NUMBERED = /^(\d+)\. (.+)$/;
const BULLET = /^- (.+)$/;
const ORDERED = /^\d+\. (.+)$/;

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ t: "text", v: text });
    text = "";
  };

  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    if (rest.startsWith("**")) {
      const end = source.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({ t: "b", c: parseInline(source.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    } else if (rest.startsWith("*")) {
      const end = findSingleStar(source, i + 1);
      if (end > i + 1) {
        flush();
        out.push({ t: "i", c: parseInline(source.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    } else if (rest.startsWith("`")) {
      const end = source.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ t: "code", v: source.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    } else if (rest.startsWith("[")) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest);
      if (link) {
        flush();
        out.push({ t: "a", href: link[2], c: parseInline(link[1]) });
        i += link[0].length;
        continue;
      }
    }
    text += source[i];
    i += 1;
  }
  flush();
  return out;
}

/** The next `*` that is not half of a `**`. */
function findSingleStar(source: string, from: number) {
  for (let i = from; i < source.length; i++) {
    if (source[i] !== "*") continue;
    if (source[i + 1] === "*") {
      i += 1;
      continue;
    }
    return i;
  }
  return -1;
}

function cells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parseLegalMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const headingLevels: number[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ t: "p", lines: paragraph.map(parseInline) });
    paragraph = [];
  };

  // The title is the first heading; sections are the shallowest heading level
  // after it, subsections anything deeper. Refund Policy §A uses ## and ###
  // where the other two use # and ##, so levels are relative, not fixed.
  for (const line of lines) {
    const match = HEADING.exec(line);
    if (match) headingLevels.push(match[1].length);
  }
  const sectionLevel = Math.min(...headingLevels.slice(1));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "" || line.trim() === "---" || line.startsWith("<!--")) {
      flushParagraph();
      continue;
    }

    const updated = UPDATED.exec(line);
    if (updated) {
      flushParagraph();
      blocks.push({ t: "updated", label: updated[1] });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const text = heading[2];
      if (!blocks.some((block) => block.t === "title")) {
        blocks.push({ t: "title", text });
      } else if (level === sectionLevel) {
        const numbered = NUMBERED.exec(text);
        blocks.push(numbered ? { t: "section", n: numbered[1], text: numbered[2] } : { t: "section", n: null, text });
      } else {
        blocks.push({ t: "subsection", text });
      }
      continue;
    }

    if (line.startsWith("|")) {
      flushParagraph();
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) tableLines.push(lines[i++]);
      i -= 1;
      const [headLine, , ...bodyLines] = tableLines;
      const head = cells(headLine);
      const rows = bodyLines.map(cells);
      if (head.length === 2 && head.every((cell) => cell === "")) {
        blocks.push({ t: "kv", rows: rows.map(([label, value]) => ({ label: parseInline(label), value: parseInline(value) })) });
      } else {
        blocks.push({ t: "table", head: head.map(parseInline), rows: rows.map((row) => row.map(parseInline)) });
      }
      continue;
    }

    if (BULLET.test(line) || ORDERED.test(line)) {
      flushParagraph();
      const ordered = ORDERED.test(line);
      const pattern = ordered ? ORDERED : BULLET;
      const items: Inline[][] = [];
      while (i < lines.length && pattern.test(lines[i])) items.push(parseInline(pattern.exec(lines[i++])![1]));
      i -= 1;
      blocks.push({ t: "list", ordered, items });
      continue;
    }

    paragraph.push(line);
  }
  flushParagraph();
  return blocks;
}
