/**
 * Trigger grammar for content pieces (Content Library §1.2):
 *
 *   <expr> := ALWAYS | <cond> [ (AND|OR) <cond> ]*
 *   <cond> := <field> <op> <value>
 *   <op>   := == | != | >= | <= | IN
 *
 * AND binds tighter than OR; there is no other nesting. A field that is NULL
 * makes every condition on it false — including `!=` — so a skipped question
 * can never satisfy a trigger by accident.
 *
 * Equality compares as text, so `outlets == '1'` and `UE01 == 5` both work.
 * `>=` / `<=` need a number on both sides and are false otherwise — the outlet
 * band ("2–5") is text and is never compared as a number.
 */

export type FactValue = number | string | null;
export type Facts = Record<string, FactValue>;

export const TRIGGER_FIELDS = [
  // Answers, stored 1–5 (option value) or NULL.
  "UE01", "UE02", "OR01", "OR02", "BP01", "MR01", "PP01", "SI01", "FL01",
  // Gates, by option label.
  "G1", "G3",
  // Profile.
  "outlets", "category", "city", "year_opened",
  // Computed.
  "band", "low", "high", "UE", "OR", "SI", "FL", "MR", "BP", "PP",
  "weakest_pillar", "weak_count", "band_count",
] as const;

const FIELDS = new Set<string>(TRIGGER_FIELDS);

type Literal = number | string;
type Condition =
  | { field: string; op: "==" | "!=" | ">=" | "<="; value: Literal }
  | { field: string; op: "IN"; values: Literal[] };

/** OR of AND-groups; an empty list means ALWAYS. */
export type Trigger = Condition[][];

const TOKEN = /\s*(?:(==|!=|>=|<=)|(\()|(\))|(,)|'([^']*)'|(-?\d+(?:\.\d+)?)(?![\w])|([A-Za-z_][A-Za-z0-9_]*))/y;

type Token =
  | { kind: "op"; value: string }
  | { kind: "punct"; value: "(" | ")" | "," }
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "word"; value: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < source.length) {
    if (/^\s*$/.test(source.slice(TOKEN.lastIndex))) break;
    const start = TOKEN.lastIndex;
    const m = TOKEN.exec(source);
    if (!m) throw new Error(`Unexpected input at ${start}: "${source.slice(start, start + 12)}"`);
    if (m[1]) tokens.push({ kind: "op", value: m[1] });
    else if (m[2] || m[3] || m[4]) tokens.push({ kind: "punct", value: (m[2] ?? m[3] ?? m[4]) as "(" });
    else if (m[5] !== undefined) tokens.push({ kind: "string", value: m[5] });
    else if (m[6] !== undefined) tokens.push({ kind: "number", value: Number(m[6]) });
    else tokens.push({ kind: "word", value: m[7] });
  }
  return tokens;
}

/** Throws on anything outside the grammar or an unknown field. */
export function parseTrigger(source: string): Trigger {
  const text = source.trim();
  if (text === "ALWAYS") return [];

  const tokens = tokenize(text);
  let i = 0;
  const next = () => tokens[i++];
  const literal = (): Literal => {
    const t = next();
    if (t?.kind === "string" || t?.kind === "number") return t.value;
    throw new Error(`Expected a value in "${source}"`);
  };

  const groups: Trigger = [[]];
  for (;;) {
    const field = next();
    if (field?.kind !== "word" || !FIELDS.has(field.value)) {
      throw new Error(`Unknown field "${field?.value ?? ""}" in "${source}"`);
    }
    const op = next();
    if (op?.kind === "op") {
      groups[groups.length - 1].push({
        field: field.value,
        op: op.value as "==",
        value: literal(),
      });
    } else if (op?.kind === "word" && op.value === "IN") {
      if (next()?.value !== "(") throw new Error(`Expected "(" after IN in "${source}"`);
      const values = [literal()];
      for (let t = next(); t?.value !== ")"; t = next()) {
        if (t?.value !== ",") throw new Error(`Expected "," or ")" in "${source}"`);
        values.push(literal());
      }
      groups[groups.length - 1].push({ field: field.value, op: "IN", values });
    } else {
      throw new Error(`Expected an operator after ${field.value} in "${source}"`);
    }

    const joiner = next();
    if (!joiner) return groups;
    if (joiner.kind === "word" && joiner.value === "AND") continue;
    if (joiner.kind === "word" && joiner.value === "OR") {
      groups.push([]);
      continue;
    }
    throw new Error(`Expected AND or OR in "${source}"`);
  }
}

const same = (a: FactValue, b: Literal) =>
  typeof a === "number" && typeof b === "number" ? a === b : String(a) === String(b);

function holds(condition: Condition, facts: Facts) {
  const actual = facts[condition.field];
  if (actual === null || actual === undefined) return false;
  switch (condition.op) {
    case "==":
      return same(actual, condition.value);
    case "!=":
      return !same(actual, condition.value);
    case "IN":
      return condition.values.some((value) => same(actual, value));
    case ">=":
    case "<=":
      if (typeof actual !== "number" || typeof condition.value !== "number") return false;
      return condition.op === ">=" ? actual >= condition.value : actual <= condition.value;
  }
}

export function evaluate(trigger: Trigger, facts: Facts) {
  return trigger.length === 0 || trigger.some((group) => group.every((c) => holds(c, facts)));
}
