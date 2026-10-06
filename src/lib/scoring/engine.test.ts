/**
 * Acceptance tests: the six test vectors in the Tier 1 Scoring Specification
 * §12 (decision D14). The engine is correct when all six reproduce exactly.
 *
 * Run with `npm test`.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import seed from "../../../database/seed/tier1-scoring-config.json" with { type: "json" };
import { ALL_QUESTIONS } from "../audit.ts";
import { score, type AnswerMap, type ScoringConfig } from "./engine.ts";
import { toFixed } from "./rational.ts";
import { toPublicScore } from "./public.ts";

const config = seed as ScoringConfig;

const FL = config.questions.find((q) => q.code === "FL01")!.options.map((o) => o.label);

type Vector = {
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

const PASS = { G1: "Registered", G3: "No" };

const VECTORS: Vector[] = [
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
];

const STATUS = { G: "Good", A: "Average", W: "Weak" } as const;
const bandName = (code: string) => config.bands.find((b) => b.code === code)!.displayName;

describe("Tier 1 test vectors (spec §12)", () => {
  for (const v of VECTORS) {
    it(v.brand, () => {
      const result = score(config, v.answers);
      assert.equal(toFixed(result.overall, 2), v.overall, "overall");
      assert.deepEqual([result.range.low, result.range.high], v.range, "range");
      assert.equal(bandName(result.scoreBand), v.scoreBand, "score band");
      assert.equal(bandName(result.band), v.band, "band after gates");
      for (const pillar of result.pillars) {
        const [expectedScore, expectedStatus] = v.pillars[pillar.code];
        assert.equal(toFixed(pillar.score!, 2), toFixed({ n: BigInt(expectedScore), d: 1n }, 2), `${pillar.code} score`);
        assert.equal(pillar.status, STATUS[expectedStatus], `${pillar.code} status`);
      }
      assert.equal(result.weakest, v.weakest, "weakest pillar");
    });
  }
});

describe("rules", () => {
  it("a null answer is excluded, never scored as zero (QB365)", () => {
    const qb = VECTORS.find((v) => v.brand === "QB365")!;
    const or = score(config, qb.answers).pillars.find((p) => p.code === "OR")!;
    assert.equal(toFixed(or.score!, 2), "100.00");
  });

  it("a pillar with no answers is left out and the weights renormalise", () => {
    const strings = VECTORS.find((v) => v.brand === "Strings")!;
    const result = score(config, { ...strings.answers, BP01: null });
    assert.equal(result.pillars.find((p) => p.code === "BP")!.score, null);
    // (6440 − 400) ÷ 90 = 67.111…
    assert.equal(toFixed(result.overall, 2), "67.11");
  });

  it("no trademark caps the band and the levels at Early Stage, but keeps the range", () => {
    const result = score(config, VECTORS[1].answers);
    assert.deepEqual(result.levels.map(bandName), ["Early Stage"]);
    assert.deepEqual([result.range.low, result.range.high], [54, 71]);
    assert.equal(result.gate, "capped");
  });

  it("an active dispute forces Not Yet Ready", () => {
    const result = score(config, { ...VECTORS[0].answers, G3: "Yes" });
    assert.equal(bandName(result.band), "Not Yet Ready");
    assert.deepEqual(result.levels.map(bandName), ["Not Yet Ready"]);
    assert.equal(result.gate, "hard");
    assert.deepEqual([result.range.low, result.range.high], [71, 88]);
  });

  it("levels list every band the range spans, highest first", () => {
    const result = score(config, VECTORS[2].answers); // Strings 56–73
    assert.deepEqual(result.levels.map(bandName), ["Almost Ready", "Early Stage"]);
    const triloma = score(config, VECTORS[0].answers); // 71–88
    assert.deepEqual(triloma.levels.map(bandName), ["Ready to Plan", "Almost Ready"]);
  });

  it("ranks gaps by weight × (100 − score)", () => {
    const result = score(config, VECTORS[2].answers); // Strings
    // UE 20×30=600 · MR 12×80=960 · BP 10×60=600 · SI 15×40=600 · FL 15×40=600 · OR 20×10=200 · PP 0
    assert.equal(result.gaps[0], "MR");
    assert.equal(result.gaps.at(-1), "PP");
  });

  it("rejects an answer that is not an option", () => {
    assert.throws(() => score(config, { ...VECTORS[0].answers, MR01: "7" }));
  });
});

describe("the overall score never leaves the server (spec §4, D2)", () => {
  for (const v of VECTORS) {
    it(v.brand, () => {
      const json = JSON.stringify(toPublicScore(config, score(config, v.answers)));
      assert.ok(!/overall/i.test(json), "no overall field");
      for (const form of [v.overall, String(Number(v.overall))]) {
        assert.ok(!json.includes(form), `overall ${form} absent`);
      }
      assert.ok(!/"score"/.test(json), "no per-pillar score field");
      assert.ok(!/weight/i.test(json), "no weights");
    });
  }
});

describe("the audit screens match the seeded register", () => {
  it("every screen question has the same options, in the same order", () => {
    for (const question of ALL_QUESTIONS) {
      const seeded = config.questions.find((q) => q.code === question.id);
      assert.ok(seeded, `${question.id} is seeded`);
      assert.deepEqual(question.options, seeded.options.map((o) => o.label), question.id);
    }
    assert.equal(ALL_QUESTIONS.length, config.questions.length);
  });
});
