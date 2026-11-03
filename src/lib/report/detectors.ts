/**
 * Section 01's detectors (Group I v1.4 §1.1, build spec §4): a priority-ordered
 * set, of which the highest that fires leads the Report. The conditions are
 * logic, so they live here; the priorities and ids must match Group I's table,
 * and a test holds them to it. The words are Group I's, by id.
 *
 * Values in the conditions are option points (1–5), as the questions score,
 * except `BP3` and `BP4`, which are the figures entered (a rating and a count).
 */

/** What a detector reads. Null when the answer is an escape or absent: a null never satisfies a condition. */
export type Facts = {
  /** A Report question's points. */
  points: (code: string) => number | null;
  /** An Audit question's points (`OR01`). */
  auditPoints: (code: string) => number | null;
  /** A figure as entered (`BP3`, `BP4`). */
  figure: (code: string) => number | null;
  /** A legal answer's label ("Yes", "Partial", "No", "Neither"), or "dont_know". */
  gate: (code: string) => string | null;
  /** UE7's figure falls inside the band chosen for UE02 in the Audit. */
  ue7InsideUe02: boolean;
  /** The Audit's outlets answer was "1". */
  oneOutlet: boolean;
  /** How many questions he answered "I don't know" (T44). */
  dontKnow: number;
};

export type DetectorKind = "legal" | "contradiction" | "fallback";

export type Detector = {
  id: string;
  priority: number;
  kind: DetectorKind;
  /** The gate a legal finding (or the entity contradiction) is about: it does not repeat in Section 05 when it leads. */
  gate: string | null;
  fires: (facts: Facts) => boolean;
};

const atLeast = (value: number | null, edge: number) => value !== null && value >= edge;
const atMost = (value: number | null, edge: number) => value !== null && value <= edge;
const is = (value: number | null, edge: number) => value === edge;

/** UE7 >= 4 AND (UE8 <= 2 OR FL3 <= 2): a healthy margin against a company at or below breakeven. */
const moneyDisagrees = (f: Facts) => atLeast(f.points("UE7"), 4) && (atMost(f.points("UE8"), 2) || atMost(f.points("FL3"), 2));

export const DETECTORS: Detector[] = [
  { id: "LF-DISPUTE", priority: 120, kind: "legal", gate: "G3", fires: (f) => f.gate("G3") === "Yes" },
  {
    id: "LF-PAPER-NO-ENTITY",
    priority: 115,
    kind: "contradiction",
    gate: "G4",
    fires: (f) => f.gate("G4") === "No" && f.gate("G2") === "Yes",
  },
  { id: "LF-NO-ENTITY", priority: 112, kind: "legal", gate: "G4", fires: (f) => f.gate("G4") === "No" && f.gate("G2") !== "Yes" },
  { id: "LF-FEE-ON-SAND", priority: 102, kind: "contradiction", gate: null, fires: (f) => moneyDisagrees(f) && is(f.points("PP6b"), 5) },
  {
    id: "LF-MONEY-DISAGREE",
    priority: 100,
    kind: "contradiction",
    gate: null,
    fires: (f) => moneyDisagrees(f) && f.points("PP6b") !== null && f.points("PP6b") !== 5,
  },
  { id: "LF-TWO-MARGINS", priority: 96, kind: "contradiction", gate: null, fires: (f) => f.ue7InsideUe02 },
  {
    id: "LF-RATED-NOT-RUN",
    priority: 92,
    kind: "contradiction",
    gate: null,
    fires: (f) => atLeast(f.points("FL4"), 4) && atMost(f.points("FL5"), 2),
  },
  {
    id: "LF-SYSTEM-UNCHECKED",
    priority: 88,
    kind: "contradiction",
    gate: null,
    fires: (f) => is(f.auditPoints("OR01"), 5) && is(f.points("OR4"), 1),
  },
  {
    id: "LF-SUPPLY-OVERRATED",
    priority: 80,
    kind: "contradiction",
    gate: null,
    fires: (f) => atLeast(f.points("OR5"), 4) && f.oneOutlet && atMost(f.points("OR3"), 2),
  },
  // T44 / T100: three or more "I don't know" answers lead with the measurement gap.
  { id: "LF-UNMEASURED", priority: 78, kind: "contradiction", gate: null, fires: (f) => f.dontKnow >= 3 },
  {
    id: "LF-DEMAND-UNREAD",
    priority: 74,
    kind: "contradiction",
    gate: null,
    fires: (f) => is(f.points("MR2"), 1) && is(f.points("MR6"), 5),
  },
  {
    id: "LF-THIN-BASE",
    priority: 72,
    kind: "contradiction",
    gate: null,
    fires: (f) => {
      const rating = f.figure("BP3");
      const reviews = f.figure("BP4");
      return rating !== null && reviews !== null && rating > 4.5 && reviews < 25;
    },
  },
  { id: "LF-LICENCES", priority: 70, kind: "legal", gate: "G5", fires: (f) => f.gate("G5") === "No" },
  { id: "LF-TRADEMARK", priority: 68, kind: "legal", gate: "G1", fires: (f) => f.gate("G1") === "Neither" },
  { id: "LF-AGREEMENT", priority: 60, kind: "legal", gate: "G2", fires: (f) => f.gate("G2") === "No" },
  { id: "LF-NO-CONTRADICTION", priority: 10, kind: "fallback", gate: null, fires: () => true },
];

/** Every detector that fires, highest priority first. The first leads; LF-NO-CONTRADICTION always fires. */
export function firedDetectors(facts: Facts): Detector[] {
  return DETECTORS.filter((detector) => detector.fires(facts)).sort((a, b) => b.priority - a.priority);
}

/** Section 02 takes up to four contradictions that fired and did not lead (spec §5). */
export const SECTION_02_MAX = 4;
