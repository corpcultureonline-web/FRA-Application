/**
 * Screen 4's questionnaire: built from the real source files, and the rules
 * that decide what counts as an answer and when a contradiction is raised
 * (Tier2-Questionnaire-Strings, Field Help v1.5 §2 and §5, T43, T47, T49, T79).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { contradictions, isAnswered, marginBand, marginFrom, parseNumber, type Answers } from "./rules.ts";
import { brandProfile, buildQuestionnaire, forBrand, parseRange } from "./source.ts";

const read = (file: string) => readFileSync(path.join(process.cwd(), "src", "content", "tier2", file), "utf8");
const structure = JSON.parse(read("questions.json"));
const q = buildQuestionnaire({
  strings: read("Tier2-Questionnaire-Strings.md"),
  structure,
  fieldHelp: read("Content-Library-Tier2-Field-Help.md"),
  questionnaireLibrary: read("Content-Library-Tier2-Questionnaire.md"),
});
const byCode = (code: string) => q.questions.find((x) => x.code === code)!;
const opt = (option: number) => ({ option, number: null, escape: null, computed: false });
const n = (number: number) => ({ option: null, number, escape: null, computed: false });

describe("questionnaire: built from its sources", () => {
  const single = forBrand(q, brandProfile("1"));
  const multi = forBrand(q, brandProfile("2–5"));

  it("35 codes in the source; a brand is asked 32 (one outlet) or 34 (more), across 8 named sections (T128, T129)", () => {
    assert.equal(q.questions.length, 35);
    assert.equal(new Set(q.questions.map((x) => x.code)).size, 35);
    assert.equal(single.questions.length, 32);
    assert.equal(multi.questions.length, 34);
    assert.deepEqual(
      q.sections.map((s) => s.name),
      ["Your numbers", "Your systems", "Your brand", "Your market", "Your partners", "Your support", "Your role", "Legal"],
    );
  });

  it("OR6 and MR5 only for two or more outlets; exactly one of PP6a and PP6b", () => {
    const codes = (set: typeof q) => set.questions.map((x) => x.code);
    for (const code of ["OR6", "MR5"]) {
      assert.ok(!codes(single).includes(code), code);
      assert.ok(codes(multi).includes(code), code);
    }
    // No source says yet whether a brand has franchisees, so every brand is asked PP6b.
    for (const set of [single, multi]) {
      assert.ok(codes(set).includes("PP6b"));
      assert.ok(!codes(set).includes("PP6a"));
    }
    const withPartners = forBrand(q, { multiOutlet: true, hasFranchisees: true });
    assert.ok(codes(withPartners).includes("PP6a"));
    assert.ok(!codes(withPartners).includes("PP6b"));
    assert.equal(withPartners.questions.length, 34);
  });

  it("FL5 comes first in Section 7 (T49), PP4 third in Section 5 (T79), MR5 between MR4 and MR6", () => {
    const order = (section: number) => multi.questions.filter((x) => x.section === section).map((x) => x.code);
    assert.deepEqual(order(7), ["FL5", "FL2", "FL3", "FL4"]);
    assert.deepEqual(order(5), ["PP2", "PP3", "PP4", "PP5", "PP6b"]);
    assert.deepEqual(order(4), ["MR2", "MR3", "MR4", "MR5", "MR6"]);
    assert.deepEqual(order(2), ["OR3", "OR4", "OR5", "OR6"]);
  });

  it("each anchored question is alone on its screen, with five options — OR6 straight after OR5", () => {
    const anchored = q.questions.filter((x) => x.type === "anchored");
    assert.deepEqual(anchored.map((x) => x.code), ["OR5", "OR6", "BP5", "PP4", "FL2", "FL3", "FL4"]);
    for (const question of anchored) {
      assert.equal(question.options.length, 5, question.code);
      assert.deepEqual(q.screens.find((s) => s.codes.includes(question.code))!.codes, [question.code]);
    }
    const screens = multi.screens.map((s) => s.codes.join(","));
    assert.equal(screens[screens.indexOf("OR5") + 1], "OR6");
  });

  it("a single-outlet brand's screens drop OR6's screen and keep MR5's neighbours together", () => {
    assert.ok(!single.screens.some((s) => s.codes.length === 0));
    assert.deepEqual(single.screens.find((s) => s.codes.includes("MR4"))!.codes, ["MR2", "MR3", "MR4", "MR6"]);
    assert.deepEqual(multi.screens.find((s) => s.codes.includes("MR4"))!.codes, ["MR2", "MR3", "MR4", "MR5", "MR6"]);
  });

  it("an unknown asked_when phrase stops the build rather than asking everyone", () => {
    const broken = structuredClone(structure);
    broken.questions.find((x: { code: string }) => x.code === "OR6").asked_when = "outlets > 1";
    assert.throws(
      () =>
        buildQuestionnaire({
          strings: read("Tier2-Questionnaire-Strings.md"),
          structure: broken,
          fieldHelp: read("Content-Library-Tier2-Field-Help.md"),
          questionnaireLibrary: read("Content-Library-Tier2-Questionnaire.md"),
        }),
      /unknown asked_when/,
    );
  });

  it("MR5 takes whole numbers from 2, and an entry of 1 has its own note (T131)", () => {
    const mr5 = byCode("MR5").input!;
    assert.deepEqual([mr5.min, mr5.max, mr5.decimals, mr5.belowRange], [2, null, 0, "T2V-MR5-ONE"]);
    assert.equal(parseNumber("1", mr5), null);
    assert.equal(parseNumber("3", mr5), 3);
  });

  it("escape answers on exactly seven questions, with the labels the founder sees", () => {
    const escapes = Object.fromEntries(q.questions.filter((x) => x.escape).map((x) => [x.code, x.escape]));
    assert.deepEqual(escapes, {
      UE7: { label: "I don't know my margin", kind: "dont_know" },
      UE9: { label: "Prefer not to answer", kind: "prefer_not" },
      BP3: { label: "We don't have a Google listing", kind: "not_applicable" },
      BP4: { label: "We don't have a Google listing", kind: "not_applicable" },
      G2: { label: "I don't know", kind: "dont_know" },
      G4: { label: "I don't know", kind: "dont_know" },
      G5: { label: "I don't know", kind: "dont_know" },
    });
  });

  it("no scoring reaches the question objects", () => {
    const text = JSON.stringify(q);
    assert.doesNotMatch(text, /`\d`|<=|→/);
    for (const question of q.questions) for (const option of question.options) assert.doesNotMatch(option, /`|\*/, option);
    assert.ok(byCode("SI6").options.includes("Less than 5"));
  });

  it("option labels lose their score but keep their words", () => {
    assert.deepEqual(byCode("UE8").options, ["Profitable for 2+ years", "Profitable for 1 year", "Breakeven", "Loss-making"]);
    assert.deepEqual(byCode("G4").options, ["Yes", "No"]);
    assert.deepEqual(byCode("SI2").options, ["None", "Less than 3 days", "3–7 days", "1–2 weeks", "2+ weeks"]);
  });
});

describe("questionnaire: numeric fields (Field Help §5)", () => {
  const ue7 = byCode("UE7").input!;
  const bp3 = byCode("BP3").input!;
  const bp4 = byCode("BP4").input!;
  const fl5 = byCode("FL5").input!;

  it("ranges read from questions.json", () => {
    assert.deepEqual(parseRange("-100..100, 1dp"), { min: -100, max: 100, decimals: 1 });
    assert.deepEqual(parseRange("0.., whole"), { min: 0, max: null, decimals: 0 });
  });

  it("UE7 takes −100 to 100 to one decimal, the minus sign included", () => {
    assert.equal(parseNumber("8.4", ue7), 8.4);
    assert.equal(parseNumber("-12.5", ue7), -12.5);
    assert.equal(parseNumber("−12", ue7), -12);
    assert.equal(parseNumber("100.1", ue7), null);
    assert.equal(parseNumber("8.45", ue7), null);
    assert.equal(parseNumber("", ue7), null);
  });

  it("BP3 1.0 to 5.0; BP4 whole and 0 upward; FL5 0 to 90", () => {
    assert.equal(parseNumber("4.3", bp3), 4.3);
    assert.equal(parseNumber("0.9", bp3), null);
    assert.equal(parseNumber("5.1", bp3), null);
    assert.equal(parseNumber("1,200", bp4), 1200);
    assert.equal(parseNumber("12.5", bp4), null);
    assert.equal(parseNumber("-1", bp4), null);
    assert.equal(parseNumber("0", fl5), 0);
    assert.equal(parseNumber("90", fl5), 90);
    assert.equal(parseNumber("91", fl5), null);
  });

  it("an escape answers the question only where that question offers it (T43)", () => {
    assert.equal(isAnswered(byCode("UE7"), { option: null, number: null, escape: "dont_know", computed: false }), true);
    assert.equal(isAnswered(byCode("UE7"), { option: null, number: null, escape: "prefer_not", computed: false }), false);
    assert.equal(isAnswered(byCode("OR5"), { option: null, number: null, escape: "dont_know", computed: false }), false);
    assert.equal(isAnswered(byCode("OR5"), opt(4)), true);
    assert.equal(isAnswered(byCode("OR5"), opt(5)), false);
    assert.equal(isAnswered(byCode("FL5"), n(91)), false);
  });

  it("the calculator: 6,40,000 revenue and 5,86,000 cost is 8.4% (board S4Sec1_calc)", () => {
    assert.equal(marginFrom(640000, 586000), 8.4);
    assert.equal(marginFrom(100000, 120000), -20);
    assert.equal(marginFrom(0, 5000), null);
  });
});

describe("questionnaire: contradictions (Field Help §5)", () => {
  const pairs = (answers: Answers, audit: string | null = null) => contradictions(q.questions, answers, audit).map((c) => c.pair);

  it("FL4 Indistinguishable with FL5 = 0, shown under FL4", () => {
    const found = contradictions(q.questions, { FL4: opt(4), FL5: n(0) }, null);
    assert.deepEqual(found.map((c) => [c.pair, c.under]), [["FL4_FL5", "FL4"]]);
    assert.deepEqual(pairs({ FL4: opt(4), FL5: n(1) }), []);
    assert.deepEqual(pairs({ FL4: opt(3), FL5: n(0) }), []);
  });

  it("Loss-making with a margin above 15%, naming the figure", () => {
    const found = contradictions(q.questions, { UE8: opt(3), UE7: n(18) }, null);
    assert.deepEqual(found.map((c) => [c.pair, c.vars]), [["UE8_UE7", { n: "18" }]]);
    assert.deepEqual(pairs({ UE8: opt(3), UE7: n(15) }), []);
  });

  it("a rating above 4.5 from under 25 reviews", () => {
    assert.deepEqual(pairs({ BP3: n(4.8), BP4: n(12) }), ["BP3_BP4"]);
    assert.deepEqual(pairs({ BP3: n(4.5), BP4: n(12) }), []);
    assert.deepEqual(pairs({ BP3: n(4.8), BP4: n(25) }), []);
  });

  it("the margin check fires when UE7 falls inside the Audit's UE02 band, upper-bound inclusive", () => {
    assert.deepEqual(pairs({ UE7: n(17) }, "15–20%"), ["UE7_UE02"]);
    assert.deepEqual(pairs({ UE7: n(20) }, "15–20%"), ["UE7_UE02"]);
    assert.deepEqual(pairs({ UE7: n(15) }, "15–20%"), []);
    assert.deepEqual(pairs({ UE7: n(10) }, "Less than 10%"), ["UE7_UE02"]);
    assert.deepEqual(pairs({ UE7: n(30) }, "More than 25%"), ["UE7_UE02"]);
  });

  it("and never when UE7 is I don't know, or there is no Audit record", () => {
    assert.deepEqual(pairs({ UE7: { option: null, number: null, escape: "dont_know", computed: false } }, "15–20%"), []);
    assert.deepEqual(pairs({ UE7: n(17) }, null), []);
  });

  it("reads every Audit margin option", () => {
    for (const label of ["Less than 10%", "10–15%", "15–20%", "20–25%", "More than 25%"]) assert.ok(marginBand(label), label);
  });
});
