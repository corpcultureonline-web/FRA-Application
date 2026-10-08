/**
 * The seven Tier 1 test vectors (Scoring Specification §12): six real audits
 * plus the constructed boundary case. Shared by the engine and content tests.
 */
import seed from "../../../database/seed/tier1-scoring-config.json" with { type: "json" };
import type { AnswerMap, ScoringConfig } from "./engine.ts";

const config = seed as ScoringConfig;

export const FL = config.questions.find((q) => q.code === "FL01")!.options.map((o) => o.label);

export type Vector = {
  brand: string;
  answers: AnswerMap;
  overall: string;
  range: [number, number];
  /** Band containing the overall score, as listed in the spec's table. */
  scoreBand: string;
  /** Band after gates. */
  band: string;
  pillars: Record<string, [number, "G" | "A" | "W"]>;
  weakest: string;
};

export const PASS = { G1: "Registered", G3: "No" };

export const VECTORS: Vector[] = [
  {
    brand: "Triloma",
    answers: {
      ...PASS,
      UE01: "Less than 12 months", // 5
      UE02: "20–25%", // 4 → UE 90
      OR01: "Yes",
      OR02: "All", // OR 100
      SI01: "Yes",
      FL01: FL[3], // 80
      MR01: "1", // 20
      BP01: "1–5", // 40
      PP01: "Yes",
    },
    overall: "79.40",
    range: [71, 88],
    scoreBand: "Ready to Plan",
    band: "Ready to Plan",
    pillars: { UE: [90, "G"], OR: [100, "G"], SI: [100, "G"], FL: [80, "G"], MR: [20, "W"], BP: [40, "W"], PP: [100, "G"] },
    weakest: "MR",
  },
  {
    brand: "Career Craft",
    answers: {
      G1: "Neither", // trademark cap
      G3: "No",
      UE01: "18–24 months", // 3
      UE02: "15–20%", // 3 → UE 60
      OR01: "Partially", // 3
      OR02: "Most", // 4 → OR 70
      SI01: "Yes",
      FL01: FL[0], // 20
      MR01: "1", // 20
      BP01: "16–40", // 80
      PP01: "Yes",
    },
    overall: "62.40",
    range: [54, 71],
    scoreBand: "Almost Ready",
    band: "Early Stage",
    pillars: { UE: [60, "A"], OR: [70, "A"], SI: [100, "G"], FL: [20, "W"], MR: [20, "W"], BP: [80, "G"], PP: [100, "G"] },
    weakest: "FL",
  },
  {
    brand: "Strings",
    answers: {
      G1: "Application filed",
      G3: "No",
      UE01: "12–18 months", // 4
      UE02: "15–20%", // 3 → UE 70
      OR01: "Yes",
      OR02: "Most", // OR 90
      SI01: "Partially", // 60
      FL01: FL[2], // 60
      MR01: "1", // 20
      BP01: "1–5", // 40
      PP01: "Yes",
    },
    overall: "64.40",
    range: [56, 73],
    scoreBand: "Almost Ready",
    band: "Almost Ready",
    pillars: { UE: [70, "A"], OR: [90, "G"], SI: [60, "A"], FL: [60, "A"], MR: [20, "W"], BP: [40, "W"], PP: [100, "G"] },
    weakest: "MR",
  },
  {
    brand: "QB365",
    answers: {
      ...PASS,
      UE01: "Less than 12 months",
      UE02: "More than 25%", // UE 100
      OR01: "Yes",
      OR02: null, // skipped — the null-handling test: OR must be 100, not 50
      SI01: "Yes",
      FL01: FL[4], // 100
      MR01: "2–3", // 60
      BP01: "6–15", // 60
      PP01: "Partially", // 60
    },
    overall: "88.00",
    range: [80, 96],
    scoreBand: "Ready to Plan",
    band: "Ready to Plan",
    pillars: { UE: [100, "G"], OR: [100, "G"], SI: [100, "G"], FL: [100, "G"], MR: [60, "A"], BP: [60, "A"], PP: [60, "A"] },
    weakest: "MR",
  },
  {
    brand: "da' mushroom",
    answers: {
      ...PASS,
      UE01: "Less than 12 months", // 5
      UE02: "20–25%", // 4 → UE 90
      OR01: "Yes",
      OR02: "Most", // OR 90
      SI01: "Yes",
      FL01: FL[1], // 40
      MR01: "4 or more", // 100
      BP01: "More than 40", // 100
      PP01: "Yes",
    },
    overall: "87.00",
    range: [79, 95],
    scoreBand: "Ready to Plan",
    band: "Ready to Plan",
    pillars: { UE: [90, "G"], OR: [90, "G"], SI: [100, "G"], FL: [40, "W"], MR: [100, "G"], BP: [100, "G"], PP: [100, "G"] },
    weakest: "FL",
  },
  {
    brand: "3 Circle",
    answers: {
      ...PASS,
      UE01: "Less than 12 months",
      UE02: "More than 25%", // UE 100
      OR01: "Partially", // 3
      OR02: "A few", // 2 → OR 50
      SI01: "Partially", // 60
      FL01: FL[0], // 20
      MR01: "1", // 20
      BP01: "6–15", // 60
      PP01: "Partially", // 60
    },
    overall: "55.20",
    range: [47, 64],
    scoreBand: "Early Stage",
    band: "Early Stage",
    pillars: { UE: [100, "G"], OR: [50, "W"], SI: [60, "A"], FL: [20, "W"], MR: [20, "W"], BP: [60, "A"], PP: [60, "A"] },
    weakest: "FL",
  },
  {
    brand: "Boundary case",
    // Constructed (spec §12, vector 7): scores 60.80, between the old integer
    // bands 41–60 and 61–75. Catches any band lookup that is not `<=`.
    answers: {
      ...PASS,
      G1: "Application filed",
      UE01: "24–36 months", // 2
      UE02: "10–15%", // 2 → UE 40
      OR01: "Partially", // 3
      OR02: "About half", // 3 → OR 60
      SI01: "Partially", // 60
      FL01: FL[2], // 60
      MR01: "4 or more", // 100
      BP01: "6–15", // 60
      PP01: "Partially", // 60
    },
    overall: "60.80",
    range: [52, 69],
    scoreBand: "Almost Ready",
    band: "Almost Ready",
    pillars: { UE: [40, "W"], OR: [60, "A"], SI: [60, "A"], FL: [60, "A"], MR: [100, "G"], BP: [60, "A"], PP: [60, "A"] },
    weakest: "UE",
  },
];

/**
 * Overall 68.00 → range 60–76, which touches three bands (Early Stage, Almost
 * Ready, Ready to Plan) — 5.4% of all answer sets (Content Library §2).
 */
export const THREE_BANDS: AnswerMap = {
  ...PASS,
  UE01: "More than 36 months",
  UE02: "Less than 10%",
  OR01: "Yes",
  OR02: "None",
  SI01: "Yes",
  FL01: FL[4],
  MR01: "4 or more",
  BP01: "0",
  PP01: "Yes",
};
