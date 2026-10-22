/**
 * The Report engine against the client's own test cases (Tier2-Questionnaire-
 * Strings.md "Test cases"): the band edges (D21), the escapes (S-1 to S-7) and
 * "a NULL is never a zero" (N-1, N-2). The config is the Audit's seeded one.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import type { Answer, Answers } from "../questionnaire/rules.ts";
import { brandProfile, buildQuestionnaire, forBrand } from "../questionnaire/source.ts";
import type { ScoringConfig } from "../scoring/engine.ts";
import { ASSESSED_MIN, oneDecimal, parsePoints, pointsFor, scoreReport, withDerived } from "./engine.ts";
import { cmp, mul, rat, sub } from "../scoring/rational.ts";

const content = (file: string) => readFileSync(path.join(process.cwd(), "src", "content", "tier2", file), "utf8");
const seed = JSON.parse(readFileSync(path.join(process.cwd(), "database", "seed", "tier1-scoring-config.json"), "utf8"));
const config: ScoringConfig = seed.config ?? seed;
const points = parsePoints(content("Tier2-Questionnaire-Strings.md"));
/** All 35 codes, as the source holds them. */
const fullSet = buildQuestionnaire({
  strings: content("Tier2-Questionnaire-Strings.md"),
  structure: JSON.parse(content("questions.json")),
  fieldHelp: content("Content-Library-Tier2-Field-Help.md"),
  questionnaireLibrary: content("Content-Library-Tier2-Questionnaire.md"),
});
/** A multi-outlet brand's 34, like the sample: OR6 and MR5 asked, PP6b not PP6a (Strings v1.2). */
const questionnaire = forBrand(fullSet, brandProfile("2–5"));

const n = (number: number): Answer => ({ option: null, number, escape: null, computed: false });
const opt = (option: number): Answer => ({ option, number: null, escape: null, computed: false });
const esc = (escape: Answer["escape"]): Answer => ({ option: null, number: null, escape, computed: false });

/** A full, ordinary answer set: every Report question on its middle option. */
function fullAnswers(): Answers {
  const answers: Answers = {};
  for (const q of questionnaire.questions) {
    if (q.type === "num") answers[q.code] = n(q.code === "BP3" ? 4.2 : q.code === "BP4" ? 300 : q.code === "FL5" ? 20 : 12);
    else answers[q.code] = opt(Math.floor(q.options.length / 2));
  }
  return answers;
}

const fullAudit = {
  UE01: "18–24 months", UE02: "10–15%", OR01: "Yes", OR02: "Most", BP01: "16–40", MR01: "2–3",
  PP01: "No", SI01: "Partially", FL01: config.questions.find((q) => q.code === "FL01")!.options[2].label,
  G1: "Application filed", G3: "No",
};

describe("Report engine: scoring maps read from the Strings file", () => {
  it("every scored Report question has a rule; the legal questions have none", () => {
    const scored = fullSet.questions.filter((q) => !q.code.startsWith("G")).map((q) => q.code);
    assert.deepEqual([...points.keys()].sort(), [...scored].sort());
  });

  it("option points in the order they are listed", () => {
    assert.deepEqual(points.get("UE8"), { kind: "options", points: [5, 3, 2, 1] });
    assert.deepEqual(points.get("SI2"), { kind: "options", points: [1, 2, 3, 4, 5] });
    assert.deepEqual(points.get("OR5"), { kind: "options", points: [1, 2, 3, 4, 5] });
  });

  // §1: every map is upper-bound inclusive; a value on an edge scores the lower band.
  const edges: [string, number, number][] = [
    ["UE7", 5, 1], ["UE7", 5.01, 2], ["UE7", 10, 2], ["UE7", 15, 3], ["UE7", 20, 4], ["UE7", 20.01, 5], ["UE7", 0, 1],
    ["BP3", 3.5, 1], ["BP3", 4.0, 2], ["BP3", 4.3, 3], ["BP3", 4.6, 4], ["BP3", 4.7, 5],
    ["BP4", 100, 1], ["BP4", 500, 2], ["BP4", 2000, 3], ["BP4", 5000, 4], ["BP4", 5001, 5], ["BP4", 1200, 3],
  ];
  for (const [code, input, expected] of edges) {
    it(`${code} = ${input} scores ${expected}`, () => assert.equal(pointsFor(points.get(code), n(input)), expected));
  }

  it("FL5: 0 → 1, 10 → 2, 30 → 3, 60 → 4, 61 → 5", () => {
    for (const [input, expected] of [[0, 1], [10, 2], [30, 3], [60, 4], [61, 5]]) {
      assert.equal(pointsFor(points.get("FL5"), n(input)), expected, String(input));
    }
  });
});

describe("Report engine: NULL handling and the escapes", () => {
  it("N-1: UE [2,5,3,3,3,NULL] is 64.0 — the NULL is out of the sum and the count", () => {
    const result = scoreReport({
      config,
      audit: { ...fullAudit, UE01: "24–36 months", UE02: "More than 25%" },
      answers: { ...fullAnswers(), UE7: n(12), UE8: opt(1), UE9: esc("prefer_not"), UE12: opt(1) },
      points,
    });
    const ue = result.pillars.find((p) => p.code === "UE")!;
    assert.equal(ue.count, 5);
    assert.equal(oneDecimal(ue.score!), "64.0");
    // N-2: read as a zero it would have been 53.3 — the failure mode this guards.
    assert.notEqual(oneDecimal(ue.score!), "53.3");
  });

  it("S-1: UE7 I don't know is NULL and raised as a measurement flag", () => {
    const result = scoreReport({ config, audit: fullAudit, answers: { ...fullAnswers(), UE7: esc("dont_know") }, points });
    assert.equal(result.pillars.find((p) => p.code === "UE")!.count, 5);
    assert.deepEqual(result.dontKnow, ["UE7"]);
  });

  it("S-2: prefer not to answer is NULL with no flag", () => {
    const result = scoreReport({ config, audit: fullAudit, answers: { ...fullAnswers(), UE9: esc("prefer_not") }, points });
    assert.equal(result.pillars.find((p) => p.code === "UE")!.count, 5);
    assert.deepEqual(result.dontKnow, []);
  });

  it("S-3 / S-4: no Google listing on BP3 and BP4 leaves BP on three answers, still assessed", () => {
    const result = scoreReport({
      config,
      audit: fullAudit,
      answers: { ...fullAnswers(), BP3: esc("not_applicable"), BP4: esc("not_applicable") },
      points,
    });
    const bp = result.pillars.find((p) => p.code === "BP")!;
    assert.equal(bp.count, 3);
    assert.equal(bp.assessed, true);
  });

  it("S-5: a legal I don't know changes no pillar count", () => {
    const base = scoreReport({ config, audit: fullAudit, answers: fullAnswers(), points });
    const withDk = scoreReport({ config, audit: fullAudit, answers: { ...fullAnswers(), G4: esc("dont_know") }, points });
    assert.deepEqual(withDk.pillars.map((p) => p.count), base.pillars.map((p) => p.count));
    assert.equal(oneDecimal(withDk.overall), oneDecimal(base.overall));
    assert.deepEqual(withDk.dontKnow, ["G4"]);
  });

  it("S-7 (T81): with every NULL-producing escape taken, each pillar keeps at least three answers", () => {
    const worst = fullAnswers();
    for (const q of questionnaire.questions) {
      if (q.escape && q.escape.kind !== "dont_know") worst[q.code] = esc(q.escape.kind);
      if (q.code === "UE7") worst[q.code] = esc("dont_know");
    }
    const result = scoreReport({ config, audit: fullAudit, answers: worst, points });
    for (const pillar of result.pillars) {
      assert.ok(pillar.count >= ASSESSED_MIN, `${pillar.code} falls to ${pillar.count}: T46 "not assessed" is now reachable`);
    }
  });
});

describe("Report engine: bands, gaps and gates", () => {
  it("gaps rank by weight × (100 − score), not by the lowest score (D8)", () => {
    const result = scoreReport({ config, audit: fullAudit, answers: fullAnswers(), points });
    const scored = result.pillars.filter((p) => p.score && p.severity);
    // Exact, as the engine ranks: two gaps a hair apart can swap if each is rounded first.
    const cost = (code: string) => {
      const p = scored.find((x) => x.code === code)!;
      return mul(p.weight, sub(rat(100), p.score!));
    };
    for (let i = 1; i < result.gaps.length; i++) assert.ok(cmp(cost(result.gaps[i - 1]), cost(result.gaps[i])) >= 0, result.gaps.join(" "));
  });

  it("no gap line for a pillar above 85, and severity follows the pillar's own score", () => {
    const result = scoreReport({ config, audit: fullAudit, answers: fullAnswers(), points });
    for (const p of result.pillars) {
      const value = Number(oneDecimal(p.score!));
      const expected = value <= 50 ? "Major" : value <= 70 ? "Moderate" : value <= 85 ? "Minor" : null;
      assert.equal(p.severity, expected, p.code);
      assert.equal(result.gaps.includes(p.code), expected !== null, p.code);
    }
  });

  it("G1 and G3 do not touch the Report's band (Group I §4.0, spec §7): the Audit's caps stay in the Audit", () => {
    const clean = scoreReport({ config, audit: fullAudit, answers: fullAnswers(), points });
    for (const audit of [{ ...fullAudit, G1: "Neither" }, { ...fullAudit, G3: "Yes" }]) {
      const result = scoreReport({ config, audit, answers: fullAnswers(), points });
      assert.equal(result.band, clean.band);
      assert.deepEqual(result.overall, clean.overall);
    }
  });
});

describe("Report engine: the multi-outlet questions (Strings v1.2)", () => {
  it("MR5 scores <=1 → 1 · <=2 → 2 · <=4 → 3 · <=7 → 4 · else 5 (Ronak, T141)", () => {
    const rule = points.get("MR5");
    for (const [outlets, score] of [[1, 1], [2, 2], [3, 3], [4, 3], [5, 4], [7, 4], [8, 5], [20, 5]]) {
      assert.equal(pointsFor(rule, n(outlets)), score, `${outlets} outlets`);
    }
  });

  it("OR6 and PP6a carry option points; PP6a scores the terms, not the structure", () => {
    assert.deepEqual(points.get("OR6"), { kind: "options", points: [1, 2, 3, 4, 5] });
    assert.deepEqual(points.get("PP6a"), { kind: "options", points: [5, 3, 1] });
  });

  it("a single-outlet brand is not asked MR5 but scores it as 1; OR6 stays null (build spec §2.2)", () => {
    const answers = fullAnswers();
    delete answers.MR5;
    delete answers.OR6;
    const derived = withDerived(answers, { multiOutlet: false });
    assert.equal(derived.MR5?.number, 1);
    assert.equal(derived.OR6, undefined);
    const withMr5 = scoreReport({ config, audit: fullAudit, answers: derived, points }).pillars.find((p) => p.code === "MR")!;
    const without = scoreReport({ config, audit: fullAudit, answers, points }).pillars.find((p) => p.code === "MR")!;
    assert.equal(withMr5.count, without.count + 1);
    // A multi-outlet brand's own answer is never overwritten.
    assert.equal(withDerived({ ...answers, MR5: n(6) }, { multiOutlet: false }).MR5?.number, 6);
    assert.equal(withDerived(answers, { multiOutlet: true }).MR5, undefined);
  });
});
