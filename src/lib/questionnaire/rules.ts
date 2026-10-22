/**
 * The questionnaire's rules, shared by the screen and the server so they cannot
 * disagree: what counts as an answer (T43), numeric validation (Field Help §5),
 * the EBITDA calculator (T47) and the four contradiction pairs (Field Help §5).
 * Pure, and free of scoring: nothing here says which answer is better.
 */
import type { EscapeKind, NumericInput, Question } from "./source.ts";

/** One saved answer. Exactly one of option, number or escape is set. */
export type Answer = {
  option: number | null;
  number: number | null;
  escape: EscapeKind | null;
  /** The figure came from the EBITDA calculator (T47). */
  computed: boolean;
};

export type Answers = Record<string, Answer | undefined>;

/** "8.4", "-3", "4,500" (BP4) → a number, or null if it is not a valid entry for the field. */
export function parseNumber(raw: string, input: NumericInput): number | null {
  const text = raw.replace(/[\s,]/g, "").replace(/^−/, "-");
  const pattern = input.decimals > 0 ? new RegExp(`^-?\\d+(\\.\\d{1,${input.decimals}})?$`) : /^-?\d+$/;
  if (!pattern.test(text)) return null;
  const value = Number(text);
  if (value < input.min || (input.max !== null && value > input.max)) return null;
  return value;
}

export function isAnswered(question: Question, answer: Answer | undefined): boolean {
  if (!answer) return false;
  if (answer.escape) return question.escape?.kind === answer.escape;
  if (question.type === "num") {
    return answer.number !== null && question.input !== null && parseNumber(String(answer.number), question.input) !== null;
  }
  return answer.option !== null && Number.isInteger(answer.option) && answer.option >= 0 && answer.option < question.options.length;
}

/**
 * The calculator: (revenue − running cost) ÷ revenue, to one decimal. Running
 * cost includes a fair salary for the founder and excludes EMI, depreciation
 * and tax — the inputs say so; the arithmetic is only this.
 */
export function marginFrom(revenue: number, cost: number): number | null {
  if (!(revenue > 0) || !(cost >= 0)) return null;
  const margin = Math.round(((revenue - cost) / revenue) * 1000) / 10;
  return Math.max(-100, Math.min(100, margin));
}

/**
 * The Audit's UE02 options as numeric bands, upper-bound inclusive (D21):
 * "Less than 10%" → ≤10, "10–15%" → (10, 15], "More than 25%" → >25.
 */
export function marginBand(label: string): { above: number | null; atMost: number | null } | null {
  const less = /^Less than (\d+(?:\.\d+)?)%$/.exec(label);
  if (less) return { above: null, atMost: Number(less[1]) };
  const range = /^(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)%$/.exec(label);
  if (range) return { above: Number(range[1]), atMost: Number(range[2]) };
  const more = /^More than (\d+(?:\.\d+)?)%$/.exec(label);
  if (more) return { above: Number(more[1]), atMost: null };
  return null;
}

export type ContradictionPair = "FL4_FL5" | "UE8_UE7" | "BP3_BP4" | "UE7_UE02";

export type Contradiction = {
  pair: ContradictionPair;
  /** The library key whose line names the earlier answer. */
  key: "T2V-CONTRA-FL" | "T2V-CONTRA-UE" | "T2V-CONTRA-BP" | "T2V-CONTRA-MARGIN";
  /** The question the warning sits under: the one on screen when the pair completes. */
  under: string;
  values: (number | null)[];
  /** Placeholders in the line ({n}, {rating}). */
  vars: Record<string, string>;
};

const optionIs = (questions: Map<string, Question>, answers: Answers, code: string, label: string) => {
  const answer = answers[code];
  const question = questions.get(code);
  return Boolean(answer && question && answer.option !== null && question.options[answer.option] === label);
};

const num = (answers: Answers, code: string) => {
  const answer = answers[code];
  return answer && !answer.escape && answer.number !== null ? answer.number : null;
};

const shown = (value: number) => String(value);

/**
 * The four pairs that do not usually go together (Field Help §5). They warn,
 * never block (T55). `auditMargin` is the label the founder chose for UE02 in
 * the Audit, or null when there is no Audit record.
 */
export function contradictions(questionList: Question[], answers: Answers, auditMargin: string | null): Contradiction[] {
  const questions = new Map(questionList.map((q) => [q.code, q]));
  const found: Contradiction[] = [];

  // FL4 = "Indistinguishable…" (its fifth sentence) with FL5 = 0. FL5 comes first (T49).
  const fl4 = questions.get("FL4");
  const fl5 = num(answers, "FL5");
  if (fl4 && answers.FL4?.option === fl4.options.length - 1 && fl5 === 0) {
    found.push({ pair: "FL4_FL5", key: "T2V-CONTRA-FL", under: "FL4", values: [answers.FL4.option + 1, 0], vars: {} });
  }

  // UE8 = Loss-making with UE7 above 15%.
  const ue7 = num(answers, "UE7");
  if (optionIs(questions, answers, "UE8", "Loss-making") && ue7 !== null && ue7 > 15) {
    found.push({ pair: "UE8_UE7", key: "T2V-CONTRA-UE", under: "UE8", values: [answers.UE8!.option, ue7], vars: { n: shown(ue7) } });
  }

  // BP3 above 4.5 with BP4 under 25.
  const bp3 = num(answers, "BP3");
  const bp4 = num(answers, "BP4");
  if (bp3 !== null && bp4 !== null && bp3 > 4.5 && bp4 < 25) {
    found.push({ pair: "BP3_BP4", key: "T2V-CONTRA-BP", under: "BP4", values: [bp3, bp4], vars: { rating: shown(bp3), n: shown(bp4) } });
  }

  // UE7 inside the band chosen for UE02 (Field Help §5, "the buildable version").
  const band = auditMargin ? marginBand(auditMargin) : null;
  if (band && ue7 !== null && (band.above === null || ue7 > band.above) && (band.atMost === null || ue7 <= band.atMost)) {
    found.push({ pair: "UE7_UE02", key: "T2V-CONTRA-MARGIN", under: "UE7", values: [ue7], vars: {} });
  }
  return found;
}
