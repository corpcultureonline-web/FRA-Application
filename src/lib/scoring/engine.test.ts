/**
 * Acceptance tests: the eight test vectors in the Tier 1 Scoring Specification
 * §12 (decision D14). The engine is correct when all eight reproduce exactly.
 *
 * Run with `npm test`.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import seed from "../../../database/seed/tier1-scoring-config.json" with { type: "json" };
import { ALL_QUESTIONS } from "../audit.ts";
import { score, type ScoringConfig } from "./engine.ts";
import { toFixed } from "./rational.ts";
import { toPublicScore } from "./public.ts";
import { THREE_BANDS, VECTORS } from "./test-vectors.ts";

const config = seed as ScoringConfig;

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
      if (v.gaps) assert.deepEqual(result.gaps, v.gaps, "gap order");
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

  it("returns a band for the 60.80 boundary case (spec §12 vector 7)", () => {
    const v = VECTORS.find((x) => x.brand === "Boundary case")!;
    const result = score(config, v.answers);
    assert.equal(bandName(result.band), "Almost Ready");
    assert.deepEqual(result.gaps, ["UE", "OR", "SI", "FL", "BP", "PP", "MR"]);
  });

  it("counts the bands the range touches before gates, up to three", () => {
    // 68.00 → 60–76: Early Stage, Almost Ready and Ready to Plan.
    const result = score(config, THREE_BANDS);
    assert.equal(toFixed(result.overall, 2), "68.00");
    assert.deepEqual(result.rangeLevels.map(bandName), ["Ready to Plan", "Almost Ready", "Early Stage"]);
    // A cap collapses the displayed levels but not the range itself (Career Craft).
    const capped = score(config, VECTORS[1].answers);
    assert.deepEqual(capped.rangeLevels.map(bandName), ["Almost Ready", "Early Stage"]);
  });

  it("ranks gaps by weight × (100 − score)", () => {
    const result = score(config, VECTORS[2].answers); // Strings
    // UE 20×30=600 · MR 12×80=960 · BP 10×60=600 · SI 15×40=600 · FL 15×40=600 · OR 20×10=200 · PP 0
    assert.equal(result.gaps[0], "MR");
    assert.equal(result.gaps.at(-1), "PP");
  });

  it("breaks gap ties on canonical order, not on the config's order (vector 8, D19)", () => {
    const tie = VECTORS.find((v) => v.brand === "Gap-rank tie")!;
    const reversed = { ...config, pillars: [...config.pillars].reverse() };
    assert.deepEqual(score(reversed, tie.answers).gaps, tie.gaps);
    assert.equal(score(reversed, tie.answers).weakest, "BP");
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
