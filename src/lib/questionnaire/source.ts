/**
 * The Report questionnaire, assembled from its three sources and nothing else:
 *
 * - Tier2-Questionnaire-Strings.md: the only source for question wording
 *   (AUTHORITIES §1), and for the order of questions within a section (T79).
 * - questions.json (design handoff): type, keypad and range, escape and help
 *   key per question. Structure only, no words.
 * - Content-Library-Tier2-Field-Help.md §2: the escape answers' labels.
 *
 * Scoring is deliberately not read here. The option points and numeric maps
 * in the Strings file stay on the server, in scoring, and never reach a page.
 * Pure: the files are passed in, so the tests read the real ones.
 */

export type QuestionType = "num" | "list" | "tiles" | "anchored";

/** The three escapes, never merged (Field Help §2; T44). */
export type EscapeKind = "not_applicable" | "dont_know" | "prefer_not";

export type NumericInput = {
  inputmode: "decimal" | "numeric";
  suffix: string | null;
  min: number;
  max: number | null;
  decimals: number;
  /** Field Help key for an entry below `min` that means something (MR5 = 1: T2V-MR5-ONE), not a plain range error. */
  belowRange: string | null;
};

/**
 * Who a conditional question is asked of (Strings v1.2, build spec §2.2):
 * `OR6` and `MR5` a brand with two or more outlets; `PP6a` a brand with
 * franchisees, `PP6b` one without. Exactly one of the last two is asked.
 */
export type AskedWhen = "multiOutlet" | "hasFranchisees" | "noFranchisees";

/** What a brand's own question set depends on. Read from its Audit profile. */
export type BrandProfile = { multiOutlet: boolean; hasFranchisees: boolean };

export type Question = {
  code: string;
  /** Null for the 31 questions every brand is asked. */
  askedWhen: AskedWhen | null;
  section: number;
  /** 1-based position in the whole questionnaire: the event log's `seq`. Never shown. */
  seq: number;
  stem: string;
  type: QuestionType;
  options: string[];
  escape: { label: string; kind: EscapeKind } | null;
  input: NumericInput | null;
  helpKey: string | null;
};

export type SubScreen = { section: number; codes: string[] };

export type Questionnaire = {
  sections: { number: number; name: string }[];
  questions: Question[];
  screens: SubScreen[];
};

type StructureEntry = {
  code: string;
  section: number;
  type: QuestionType;
  option_count?: number;
  escape?: { key: string | null };
  input?: { inputmode: "decimal" | "numeric"; suffix: string | null; range: string; below_range?: string };
  help_key?: string;
  /** questions.json v3.0: "outlets_band != 'ONE'", "brand has existing franchisees", "brand has no existing franchisees". */
  asked_when?: string;
};

export type Structure = { questions: StructureEntry[] };

/** questions.json's `asked_when` phrases, read exactly: an unknown phrase is an error, not a question asked of everyone. */
function askedWhen(entry: StructureEntry): AskedWhen | null {
  const rule = entry.asked_when?.trim();
  if (!rule) return null;
  if (rule === "outlets_band != 'ONE'") return "multiOutlet";
  if (rule === "brand has existing franchisees") return "hasFranchisees";
  if (rule === "brand has no existing franchisees") return "noFranchisees";
  throw new Error(`${entry.code}: unknown asked_when "${rule}"`);
}

/** "**7a. How consistent…?** *(OR6 — anchored · asked only when …)*", "**20. …** *(PP6b · asked only when …)*". */
const STEM = /^\*\*\d+[a-z]?\. (.+?)\*\* \*\(([A-Za-z0-9]+)(?: — anchored)?(?: · [^)]*)?\)\*/;
const ANCHOR_OPTION = /^\d+\. (.+)$/;

/** "- Profitable for 2+ years `5`" or "- None `5` · Manageable `3` · Yes, material `1`". */
function listOptions(line: string): string[] {
  return line
    .replace(/^- /, "")
    .replace(/\s+—\s+\*[^*]*\*\s*$/, "")
    .split(" · ")
    .map((option) => option.replace(/\s*`[^`]*`\s*$/, "").trim())
    .filter(Boolean);
}

/** "-100..100, 1dp" · "1.0..5.0, 1dp" · "0.., whole" · "0..90, whole". */
export function parseRange(range: string): Pick<NumericInput, "min" | "max" | "decimals"> {
  const match = /^(-?[\d.]+)\.\.(-?[\d.]+)?,\s*(?:(\d)dp|whole)$/.exec(range.trim());
  if (!match) throw new Error(`Unreadable input range: ${range}`);
  return { min: Number(match[1]), max: match[2] === undefined ? null : Number(match[2]), decimals: Number(match[3] ?? 0) };
}

type Parsed = { code: string; stem: string; options: string[] };

/** Questions in the Strings file's order, with their wording. */
export function parseStrings(markdown: string): Parsed[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  // The test cases at the end repeat codes in tables; questions stop there.
  const end = lines.findIndex((line) => line.startsWith("# Test cases"));
  const parsed: Parsed[] = [];
  let current: Parsed | null = null;
  for (const line of lines.slice(0, end === -1 ? undefined : end)) {
    const stem = STEM.exec(line);
    if (stem) {
      current = { code: stem[2], stem: stem[1], options: [] };
      parsed.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("## ") || line === "---") {
      current = null;
    } else if (line.startsWith("- ")) {
      current.options.push(...listOptions(line));
    } else if (ANCHOR_OPTION.test(line)) {
      current.options.push(ANCHOR_OPTION.exec(line)![1]);
    }
  }
  return parsed;
}

/** "Your numbers · Your systems · … · Legal", under "Section names" in the Questionnaire library. */
export function parseSectionNames(markdown: string): string[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const heading = lines.findIndex((line) => /^### Section names/.test(line));
  const line = lines.slice(heading + 1).find((l) => l.trim());
  if (heading === -1 || !line) throw new Error("Section names not found in the Questionnaire library");
  return line.split(" · ").map((name) => name.trim());
}

/**
 * Field Help §2, "Which questions get an escape answer": the label is the bold
 * (or, for UE9's existing answer, italic) text in the row's last cell.
 */
export function parseEscapeLabels(markdown: string): Map<string, string> {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => /^### Which questions get an escape answer/.test(line));
  const labels = new Map<string, string>();
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("#")) break;
    const row = /^\| `([A-Za-z0-9]+)` \|[^|]*\| (.+) \|$/.exec(line);
    if (!row) continue;
    const label = /\*\*([^*]+)\*\*/.exec(row[2])?.[1] ?? /^\*([^*]+)\*/.exec(row[2])?.[1];
    if (label) labels.set(row[1], label);
  }
  return labels;
}

/**
 * Which escape a question offers: the legal three and UE7 ask what the founder
 * knows, UE9 is a deliberate withhold, BP3/BP4 say the thing does not exist
 * (Field Help §2; test cases S-1 to S-5).
 */
function escapeKind(code: string): EscapeKind {
  if (code === "UE9") return "prefer_not";
  if (code === "BP3" || code === "BP4") return "not_applicable";
  return "dont_know";
}

/**
 * Sub-screens: each anchored question alone (one per screen, five cards), and
 * the questions between them grouped, in the Strings file's order. That is
 * questions.json's grouping everywhere except Section 5, where T79 puts PP4
 * third — between PP3 and PP5 — and one order governs display and review.
 */
function subScreens(questions: Question[]): SubScreen[] {
  const screens: (SubScreen & { anchored: boolean })[] = [];
  for (const question of questions) {
    const last = screens.at(-1);
    const anchored = question.type === "anchored";
    if (last && last.section === question.section && !anchored && !last.anchored) {
      last.codes.push(question.code);
    } else {
      screens.push({ section: question.section, codes: [question.code], anchored });
    }
  }
  return screens.map(({ section, codes }) => ({ section, codes }));
}

export function buildQuestionnaire({
  strings,
  structure,
  fieldHelp,
  questionnaireLibrary,
}: {
  strings: string;
  structure: Structure;
  fieldHelp: string;
  questionnaireLibrary: string;
}): Questionnaire {
  const names = parseSectionNames(questionnaireLibrary);
  const escapes = parseEscapeLabels(fieldHelp);
  const byCode = new Map(structure.questions.map((entry) => [entry.code, entry]));

  const questions = parseStrings(strings).map((parsed, index): Question => {
    const entry = byCode.get(parsed.code);
    if (!entry) throw new Error(`${parsed.code} is in the Strings file but not in questions.json`);
    if (entry.type !== "num" && parsed.options.length !== entry.option_count) {
      throw new Error(`${parsed.code}: ${parsed.options.length} options, questions.json says ${entry.option_count}`);
    }
    const escapeLabel = escapes.get(parsed.code);
    if (entry.escape && !escapeLabel) throw new Error(`${parsed.code} has an escape but Field Help gives no label`);
    return {
      code: parsed.code,
      askedWhen: askedWhen(entry),
      section: entry.section,
      seq: index + 1,
      stem: parsed.stem,
      type: entry.type,
      options: parsed.options,
      escape: entry.escape && escapeLabel ? { label: escapeLabel, kind: escapeKind(parsed.code) } : null,
      input: entry.input
        ? {
            inputmode: entry.input.inputmode,
            suffix: entry.input.suffix,
            ...parseRange(entry.input.range),
            belowRange: entry.input.below_range ?? null,
          }
        : null,
      helpKey: entry.help_key ?? null,
    };
  });

  return {
    sections: names.map((name, i) => ({ number: i + 1, name })),
    questions,
    screens: subScreens(questions),
  };
}

/**
 * A brand's own questionnaire (Strings v1.2): 32 questions for one outlet, 34
 * for more — `OR6` on its own screen after `OR5`, `MR5` between `MR4` and
 * `MR6` — with `PP6a` in `PP6b`'s slot for a brand that has franchisees. Eight
 * sections either way. Questions keep their place (`seq`) in the full set.
 */
export function forBrand(questionnaire: Questionnaire, brand: BrandProfile): Questionnaire {
  const asked = (question: Question) =>
    question.askedWhen === null ||
    (question.askedWhen === "multiOutlet" && brand.multiOutlet) ||
    (question.askedWhen === "hasFranchisees" && brand.hasFranchisees) ||
    (question.askedWhen === "noFranchisees" && !brand.hasFranchisees);
  const questions = questionnaire.questions.filter(asked);
  const codes = new Set(questions.map((q) => q.code));
  return {
    sections: questionnaire.sections,
    questions,
    screens: questionnaire.screens
      .map((screen) => ({ ...screen, codes: screen.codes.filter((code) => codes.has(code)) }))
      .filter((screen) => screen.codes.length > 0),
  };
}

/**
 * The brand profile from the Audit. Outlets: the Audit's "1" is one outlet;
 * "2–5", "6–15" and "16+" are more than one. **Whether a brand already has
 * franchisees is asked nowhere yet** — not in the Audit, not in the Report —
 * so every brand is treated as having none (`PP6b`), as the sample is.
 */
export function brandProfile(outlets: string): BrandProfile {
  return { multiOutlet: outlets.trim() !== "1", hasFranchisees: false };
}
