/**
 * The Report's words, read from the client's libraries as written (Report
 * library §2: "almost nothing on this screen is written here"). Pure: the
 * markdown is passed in, so the tests read the real files.
 *
 * - Group A §A2: the pillar subtitles.
 * - Group C: the pillar diagnosis blocks, by pillar and band.
 * - Group D: the ranked gap lines, by pillar and severity.
 * - Group E: the framing pieces E1–E8.
 * - Group I: the lead finding, the detectors, the free-result comparison, the
 *   non-negotiables, the "what you told us" labels and the Report's headings.
 * - Tier 1 result page §2: the readiness ladder (the same standard, R4).
 * - Report library: the page's own keys (keys.json names it as their owner).
 */
import { parseLibraryKeys } from "../tier2/library.ts";

/** A block's paragraphs, markup kept (`**bold**`), as the library has them. */
export type Paragraphs = string[];

export type Severity = "Major" | "Moderate" | "Minor";
export const SEVERITY_CODE: Record<Severity, string> = { Major: "MAJ", Moderate: "MOD", Minor: "MIN" };

export type ReportContent = {
  /** Library file → its version line ("1.4"), recorded with every Report. */
  versions: Record<string, string>;
  subtitles: Map<string, string>;
  /** `UE:B3` → Group C paragraphs. */
  diagnosis: Map<string, Paragraphs>;
  /** `UE:Major` → Group D's one sentence. */
  gapLines: Map<string, string>;
  /** `E1` … `E8` → the quoted piece. */
  framing: Map<string, Paragraphs>;
  /** Group I blocks by id: `LF-*`, `I-LEAD-*`, `I-NN-*`. */
  blocks: Map<string, Paragraphs>;
  /** Group I §1.1: id → priority, as the table lists them. */
  detectorTable: Map<string, number>;
  /** Group I §3.1 frames, keyed `I-CMP-*`. */
  comparison: Map<string, string>;
  /** `{position}`: "inside" (with `{where}`), "above", "below". */
  position: { inside: string; above: string; below: string };
  /** `{where}`, in the order Group I lists them. */
  where: string[];
  /** Group I §5: question code → "what you told us" label. */
  labels: Map<string, string>;
  /** Group I §6.5: gate → Section 05 row title. */
  gateTitles: Map<string, string>;
  /** Group I §6.2: the five scale labels, lowest band first. */
  scale: string[];
  /** `T2R-*` keys: Report library first (it owns them in keys.json), then Group I §6. */
  keys: Map<string, string>;
  /** Tier 1 result page §2: `LADDER-1` … `LADDER-5`, `LADDER-INTRO`. */
  ladder: Map<string, string>;
  /** Report library §4, `T2R-NOTASSESSED-BLOCK`: heading with `{Pillar}`, then three paragraphs. */
  notAssessed: Paragraphs | null;
  /** Report library §5: glance tile label → its value and caption templates. */
  tiles: Map<string, { value: string; caption: string; valueOne: string | null }>;
};

const lines = (markdown: string) => markdown.replace(/\r\n/g, "\n").split("\n");

export function versionOf(markdown: string): string | null {
  return /\*\*Version ([0-9.]+)/.exec(markdown)?.[1] ?? null;
}

/** The lines from the heading matching `start` to the next heading at its level or above. */
function slice(markdown: string, start: RegExp): string[] {
  const all = lines(markdown);
  const from = all.findIndex((line) => start.test(line));
  if (from === -1) return [];
  const level = /^#+/.exec(all[from])?.[0].length ?? 1;
  const end = all.findIndex((line, i) => i > from && new RegExp(`^#{1,${level}} `).test(line));
  return all.slice(from + 1, end === -1 ? undefined : end);
}

/** Blockquote paragraphs: `> text` lines, split on `>` alone. Lines of one paragraph join with a newline. */
export function quoted(block: string[]): Paragraphs {
  const paragraphs: Paragraphs = [];
  let current: string[] = [];
  let inQuote = false;
  const flush = () => {
    if (current.length) paragraphs.push(current.join("\n"));
    current = [];
  };
  for (const line of block) {
    if (line.startsWith(">")) {
      inQuote = true;
      const text = line.replace(/^>\s?/, "");
      if (text.trim() === "") flush();
      else current.push(text);
    } else if (inQuote) {
      flush();
      inQuote = false;
      // Only the first quote under a heading is the piece; notes may quote after it.
      if (paragraphs.length) break;
    }
  }
  flush();
  return paragraphs;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

const isRow = (line: string) => line.startsWith("|") && !/^\|[\s:|-]+\|$/.test(line.trim());

/** `| \`CODE\` | … | copy |` rows → CODE → last cell. */
function codeRows(block: string[]): Map<string, string> {
  const rows = new Map<string, string>();
  for (const line of block.filter(isRow)) {
    const row = cells(line);
    const code = /^`([^`]+)`$/.exec(row[0])?.[1];
    if (code && !rows.has(code)) rows.set(code, row[row.length - 1]);
  }
  return rows;
}

/** `### \`ID\` …` headings → the quote under each. */
function idBlocks(markdown: string): Map<string, Paragraphs> {
  const blocks = new Map<string, Paragraphs>();
  const all = lines(markdown);
  all.forEach((line, i) => {
    const id = /^###\s+`([A-Z0-9-]+)`/.exec(line)?.[1];
    if (!id || blocks.has(id)) return;
    const end = all.findIndex((next, j) => j > i && /^#{1,3} /.test(next));
    const paragraphs = quoted(all.slice(i + 1, end === -1 ? undefined : end));
    if (paragraphs.length) blocks.set(id, paragraphs);
  });
  return blocks;
}

const stripBold = (text: string) => text.replace(/^\*\*(.+)\*\*$/, "$1");

/** Group C and D head each pillar `# 1. UNIT ECONOMICS (20%)`; the config names them in title case. */
function pillarByHeading(heading: string, pillars: { code: string; name: string }[]) {
  const name = /^# \d+\. (.+?) \(\d+%\)/.exec(heading)?.[1];
  return pillars.find((p) => p.name.toUpperCase() === name?.toUpperCase())?.code ?? null;
}

export function parseDiagnosis(markdown: string, pillars: { code: string; name: string }[]) {
  const diagnosis = new Map<string, Paragraphs>();
  const all = lines(markdown);
  let pillar: string | null = null;
  all.forEach((line, i) => {
    if (line.startsWith("# ")) pillar = pillarByHeading(line, pillars);
    const band = /^### Band (\d)/.exec(line)?.[1];
    if (!pillar || !band) return;
    const end = all.findIndex((next, j) => j > i && /^#{1,3} /.test(next));
    diagnosis.set(`${pillar}:B${band}`, quoted(all.slice(i + 1, end === -1 ? undefined : end)));
  });
  return diagnosis;
}

export function parseGapLines(markdown: string, pillars: { code: string; name: string }[]) {
  const gapLines = new Map<string, string>();
  let pillar: string | null = null;
  for (const line of lines(markdown)) {
    if (line.startsWith("# ")) pillar = pillarByHeading(line, pillars);
    if (!pillar || !isRow(line)) continue;
    const [severity, text] = cells(line);
    const name = stripBold(severity);
    if (name === "Major" || name === "Moderate" || name === "Minor") gapLines.set(`${pillar}:${name}`, text);
  }
  return gapLines;
}

export function parseFraming(markdown: string) {
  const framing = new Map<string, Paragraphs>();
  for (const line of lines(markdown)) {
    const id = /^## (E\d)\. /.exec(line)?.[1];
    if (id) framing.set(id, quoted(slice(markdown, new RegExp(`^## ${id}\\. `))));
  }
  return framing;
}

export function parseSubtitles(markdown: string, pillars: { code: string; name: string }[]) {
  const subtitles = new Map<string, string>();
  for (const line of slice(markdown, /^## A2\. /).filter(isRow)) {
    const [name, subtitle] = cells(line);
    const code = pillars.find((p) => p.name === name)?.code;
    if (code) subtitles.set(code, subtitle.replace(/^\*(.+)\*$/, "$1"));
  }
  return subtitles;
}

/** Group I §1.3: `### Profit & Payback *(UE, 20%)*` then `| **Major** | block |`. */
function parseLeads(markdown: string, blocks: Map<string, Paragraphs>) {
  let pillar: string | null = null;
  for (const line of slice(markdown, /^## 1\.3 /)) {
    const code = /^### .+\*\(([A-Z]{2}), \d+%\)\*/.exec(line)?.[1];
    if (code) pillar = code;
    if (!pillar || !isRow(line)) continue;
    const [severity, text] = cells(line);
    const name = stripBold(severity) as Severity;
    if (name in SEVERITY_CODE) blocks.set(`I-LEAD-${pillar}-${SEVERITY_CODE[name]}`, [text]);
  }
}

function parseDetectorTable(markdown: string) {
  const table = new Map<string, number>();
  for (const line of slice(markdown, /^### The table/).filter(isRow)) {
    const [priority, id] = cells(line);
    const code = /^`([A-Z-]+)`$/.exec(id)?.[1];
    if (code && /^\d+$/.test(priority)) table.set(code, Number(priority));
  }
  return table;
}

/** Group I §1.1's "Fires when" column, by detector id: what the review panel shows beside a finding (Admin §3). */
export function parseDetectorConditions(markdown: string) {
  const conditions = new Map<string, string>();
  for (const line of slice(markdown, /^### The table/).filter(isRow)) {
    const [, id, when] = cells(line);
    const code = /^`([A-Z-]+)`$/.exec(id ?? "")?.[1];
    if (code && when) conditions.set(code, when.replace(/`/g, "").replace(/\s*\*\(([^)]*)\)\*/g, " ($1)"));
  }
  return conditions;
}

function parsePosition(markdown: string) {
  const section = slice(markdown, /^## 3\.1 /);
  const rows = section.filter(isRow).map(cells);
  const text = (condition: string) => rows.find((row) => row[0] === `\`${condition}\``)?.[1] ?? "";
  const whereLine = section.find((line) => line.startsWith("`{where}`:")) ?? "";
  return {
    position: { inside: text("low <= overall <= high"), above: text("overall > high"), below: text("overall < low") },
    where: [...whereLine.replace(/^`\{where\}`:/, "").split(/,\s*by where/)[0].matchAll(/`([^`]+)`/g)].map((m) => m[1]),
  };
}

export function parseGroupI(markdown: string) {
  const blocks = idBlocks(markdown);
  parseLeads(markdown, blocks);
  const { position, where } = parsePosition(markdown);
  // Some §6 tables add a "Where" column after the copy, so read the column headed Copy.
  // (Not the whole file: §4.5's state table names the markers with a "Counts" column last.)
  const keys = new Map(parseLibraryKeys(slice(markdown, /^# 6\. /).join("\n")));
  // A `| Key | Source | Copy |` row anywhere is the string itself: it adds `T2R-05-INTRO` (§4.8)
  // and beats an earlier mention of the same key in a "Was / Now" table (`T2R-DISCLAIMER`, v1.12).
  for (const line of lines(markdown).filter(isRow)) {
    const [key, source, copy] = cells(line);
    const code = /^`(T2R-[A-Z0-9-]+)`$/.exec(key ?? "")?.[1];
    if (code && copy && /^\*\*(Lifted|Approved|Stated|Authored)\*\*$/.test(source)) keys.set(code, copy);
  }
  // A header cell may carry a bold note after the copy: "Score out of 100 — **the bar table's header…**".
  for (const [key, copy] of keys) if (key.startsWith("T2R-TH-")) keys.set(key, copy.replace(/ — \*\*.*$/, ""));
  // §6.3: `T2R-TILE-SCORE` **Your score** · …
  for (const m of slice(markdown, /^## 6\.3 /).join("\n").matchAll(/`(T2R-TILE-[A-Z]+)` \*\*([^*]+)\*\*/g)) keys.set(m[1], m[2]);
  // §6.2 (T119): one keyed row per scale label.
  const scale = [1, 2, 3, 4, 5].map((i) => keys.get(`T2R-SCALE-${i}`)).filter((label): label is string => Boolean(label));
  return {
    blocks,
    detectorTable: parseDetectorTable(markdown),
    comparison: new Map([...codeRows(slice(markdown, /^## 3\.1 /))].filter(([key]) => key.startsWith("I-CMP-"))),
    position,
    where,
    labels: codeRows(slice(markdown, /^# 5\. /)),
    gateTitles: codeRows(slice(markdown, /^## 6\.5 /)),
    scale,
    keys,
  };
}

export function parseLadder(markdown: string) {
  const section = slice(markdown, /^# 2\. LADDER/);
  const ladder = new Map([...codeRows(section)].filter(([key]) => /^LADDER-\d$/.test(key)));
  const intro = /\(`LADDER-INTRO`, always\): \*(.+)\*$/.exec(section.find((line) => line.includes("`LADDER-INTRO`")) ?? "")?.[1];
  if (intro) ladder.set("LADDER-INTRO", intro);
  return ladder;
}

/** Report library §5, "The captions are templates": one row per tile — label, value template, caption template. */
export function parseTiles(markdown: string) {
  const tiles = new Map<string, { value: string; caption: string; valueOne: string | null }>();
  for (const line of slice(markdown, /^### The captions are templates/).filter(isRow)) {
    const [label, valueCell, captionCell] = cells(line);
    // A cell holds its template in backticks; v1.9 adds the singular to the same cell: "`{n} items` — **`1 item` at one**".
    const [value, valueOne] = [...(valueCell ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const caption = /`([^`]+)`/.exec(captionCell ?? "")?.[1];
    if (label !== "Tile" && value && caption) tiles.set(label, { value, caption, valueOne: valueOne ?? null });
  }
  return tiles;
}

/** The quote that follows the line naming `T2R-NOTASSESSED-BLOCK` in the Report library's prose. */
export function parseNotAssessed(markdown: string): Paragraphs | null {
  const all = lines(markdown);
  const at = all.findIndex((line) => line.includes("`T2R-NOTASSESSED-BLOCK`"));
  if (at === -1) return null;
  const paragraphs = quoted(all.slice(at + 1));
  return paragraphs.length ? paragraphs : null;
}

export type ContentFiles = {
  groupA: string;
  groupC: string;
  groupD: string;
  groupE: string;
  groupI: string;
  tier1Result: string;
  report: string;
};

export const CONTENT_FILES: Record<keyof ContentFiles, string> = {
  groupA: "Content-Library-Group-A.md",
  groupC: "Content-Library-Group-C.md",
  groupD: "Content-Library-Group-D.md",
  groupE: "Content-Library-Group-E.md",
  groupI: "Content-Library-Group-I.md",
  tier1Result: "Content-Library-Tier1-Result-Page.md",
  report: "Content-Library-Tier2-Report.md",
};

export function buildContent(files: ContentFiles, pillars: { code: string; name: string }[]): ReportContent {
  const groupI = parseGroupI(files.groupI);
  // keys.json owns T2R-FINAL etc. in the Report library; Group I adds the headings it lacks.
  const keys = new Map(parseLibraryKeys(files.report));
  for (const [key, copy] of groupI.keys) if (!keys.has(key)) keys.set(key, copy);
  const versions: Record<string, string> = {};
  for (const [name, file] of Object.entries(CONTENT_FILES)) {
    versions[file] = versionOf(files[name as keyof ContentFiles]) ?? "unversioned";
  }
  return {
    versions,
    subtitles: parseSubtitles(files.groupA, pillars),
    diagnosis: parseDiagnosis(files.groupC, pillars),
    gapLines: parseGapLines(files.groupD, pillars),
    framing: parseFraming(files.groupE),
    blocks: groupI.blocks,
    detectorTable: groupI.detectorTable,
    comparison: groupI.comparison,
    position: groupI.position,
    where: groupI.where,
    labels: groupI.labels,
    gateTitles: groupI.gateTitles,
    scale: groupI.scale,
    keys,
    ladder: parseLadder(files.tier1Result),
    notAssessed: parseNotAssessed(files.report),
    tiles: parseTiles(files.report),
  };
}

/** Fills `{slot}` placeholders; a slot with no value is left as written, so a gap shows. */
export function fill(frame: string, values: Record<string, string>): string {
  return frame.replace(/\{([a-z_]+)\}/g, (whole, name: string) => values[name] ?? whole);
}
