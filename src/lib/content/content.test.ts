/**
 * Content Library selection (Tier 1 result page and PDF). The Strings case
 * reproduces Content Library §11: its triggers must land on the observations
 * that were written by hand for that brand's report.
 *
 * Run with `npm test`.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import scoringSeed from "../../../database/seed/tier1-scoring-config.json" with { type: "json" };
import contentSeed from "../../../database/seed/tier1-content.json" with { type: "json" };
import { score, type AnswerMap, type ScoringConfig } from "../scoring/engine.ts";
import { buildFacts, type ProfileFacts } from "./facts.ts";
import { fillSlots, selectContent, type ContentPiece, type SlotValues } from "./select.ts";
import { evaluate, parseTrigger, type Facts } from "./triggers.ts";

const config = scoringSeed as ScoringConfig;
const FL = config.questions.find((q) => q.code === "FL01")!.options.map((o) => o.label);

const pieces: ContentPiece[] = contentSeed.pieces.map((p) => ({
  id: p.id,
  section: p.section,
  note_type: ("note_type" in p ? p.note_type : null) as ContentPiece["note_type"],
  priority: p.priority,
  trigger_expr: p.trigger,
  heading: "heading" in p ? (p.heading as string) : null,
  body: p.body,
  active: true,
}));

const STRINGS: AnswerMap = {
  G1: "Application filed",
  G3: "No",
  UE01: "12–18 months",
  UE02: "15–20%",
  OR01: "Yes",
  OR02: "Most",
  SI01: "Partially",
  FL01: FL[2],
  MR01: "1",
  BP01: "1–5",
  PP01: "Yes",
};

function run(answers: AnswerMap, profile: Partial<ProfileFacts> = {}) {
  const full = { outlets: "1", category: "Services", city: "Chennai", ...profile };
  const result = score(config, answers);
  const facts = buildFacts(config, answers, full, result);
  const slots: SlotValues = {
    brand: "Test",
    outlets: full.outlets,
    city: full.city,
    low: String(result.range.low),
    high: String(result.range.high),
    weak_count: String(facts.weak_count),
  };
  const errors: string[] = [];
  return { content: selectContent(pieces, facts, slots, (m) => errors.push(m)), facts, errors };
}

describe("trigger grammar", () => {
  const facts: Facts = { UE01: 4, OR01: null, outlets: "2–5", G1: "Neither", band: "ALMOST_READY" };
  const check = (expr: string) => evaluate(parseTrigger(expr), facts);

  it("evaluates ALWAYS, comparisons and IN", () => {
    assert.equal(check("ALWAYS"), true);
    assert.equal(check("UE01 == 4"), true);
    assert.equal(check("UE01 >= 5"), false);
    assert.equal(check("UE01 IN (3, 4)"), true);
    assert.equal(check("G1 == 'Neither'"), true);
  });

  it("makes every condition on a NULL field false, including !=", () => {
    assert.equal(check("OR01 == 5"), false);
    assert.equal(check("OR01 != 5"), false);
    assert.equal(check("OR01 <= 5"), false);
  });

  it("binds AND tighter than OR", () => {
    assert.equal(check("UE01 == 1 AND OR01 == 1 OR band == 'ALMOST_READY'"), true);
    assert.equal(check("UE01 == 4 OR UE01 == 1 AND band == 'NOPE'"), true);
  });

  it("compares the outlet band as text, never as a number", () => {
    assert.equal(check("outlets == '2–5'"), true);
    assert.equal(check("outlets IN ('1', '2–5')"), true);
    assert.equal(check("outlets >= 2"), false);
    assert.equal(check("outlets <= 5"), false);
  });

  it("rejects unknown fields and malformed input", () => {
    assert.throws(() => parseTrigger("overall >= 50"));
    assert.throws(() => parseTrigger("UE01 = 4"));
    assert.throws(() => parseTrigger("UE01 == 4 XOR UE02 == 3"));
  });
});

describe("slots", () => {
  it("has no {overall} slot", () => {
    assert.throws(() => fillSlots("You scored {overall}", { low: "56" }));
  });

  it("skips a piece whose slot has no value", () => {
    assert.equal(fillSlots("Opened in {year_opened}", {}), null);
    assert.equal(fillSlots("{low} to {high}", { low: "56", high: "73" }), "56 to 73");
  });
});

describe("seeded content", () => {
  it("parses every trigger and uses only known slots", () => {
    for (const piece of pieces) {
      assert.doesNotThrow(() => parseTrigger(piece.trigger_expr), piece.id);
      const full: SlotValues = {
        brand: "b", outlets: "1", city: "c", low: "1", high: "2", band: "x",
        weakest_area: "w", weak_count: "2", weak_list: "a", year_opened: "2020",
      };
      assert.doesNotThrow(() => fillSlots(piece.body, full), piece.id);
      if (piece.heading) assert.doesNotThrow(() => fillSlots(piece.heading!, full), piece.id);
    }
  });

  it("has unique ids", () => {
    assert.equal(new Set(pieces.map((p) => p.id)).size, pieces.length);
  });
});

describe("Strings (Content Library §11)", () => {
  const { content, facts, errors } = run(STRINGS);
  const ids = (section: string) =>
    pieces
      .filter((p) => p.section === section && evaluate(parseTrigger(p.trigger_expr), facts))
      .map((p) => p.id);

  it("logs no content errors", () => assert.deepEqual(errors, []));

  it("selects the hand-written observations", () => {
    assert.deepEqual(
      content.noticed.map((n) => n.heading),
      [
        "You have built the structure before the scale.",
        "Your next milestone is a second outlet you run yourself.",
        "Your numbers are steady rather than stretched.",
        "You protected the brand before you needed to.",
      ],
    );
  });

  it("fires 10 important points and shows the top 6", () => {
    assert.equal(ids("IMPORTANT_POINTS").length, 10);
    assert.equal(content.importantPoints.length, 6);
    assert.match(content.importantPoints[0].text, /operating procedures are written down/);
  });

  it("builds the remaining sections", () => {
    assert.equal(content.nutshell.length, 5);
    assert.equal(content.cannotTell?.items.length, 3);
    assert.equal(content.cannotTell?.items[0].heading, "Are you at 56, or at 73?");
    assert.equal(content.cannotTell?.items[1].heading, "Would this work where nobody knows your name?");
    assert.equal(Object.keys(content.ladder.bodies).length, 5);
    assert.equal(content.ladder.close, "Your score range of 56 to 73 covers these two levels.");
    assert.deepEqual(
      content.canDoNow?.actions.map((a) => a.heading),
      ["Finish the training programme.", "Open or plan your second outlet."],
    );
    assert.match(content.canDoNow?.lead ?? "", /nothing on the legal or paperwork side/);
    assert.match(content.upgrade?.body ?? "", /₹1,999 \+ 18% GST/);
  });
});

describe("other profiles", () => {
  it("leads with the trademark when none is filed", () => {
    const { content } = run({ ...STRINGS, G1: "Neither" });
    assert.equal(content.noticed[0].heading, "One short piece of paperwork is holding your result down.");
    assert.equal(content.canDoNow?.actions[0].heading, "File your trademark.");
    assert.match(content.canDoNow?.lead ?? "", /holding your result down/);
  });

  it("uses the outlet band as text for multi-outlet brands", () => {
    const { content } = run({ ...STRINGS, OR01: "Partially" }, { outlets: "6–15" });
    assert.equal(content.noticed[0].heading, "You have grown faster than you have written things down.");
    assert.match(content.noticed[0].body, /^6–15 outlets running/);
    assert.ok(!content.noticed.some((n) => n.heading.includes("second outlet")));
  });

  it("does not treat 2–5 outlets as three or more", () => {
    const { content } = run({ ...STRINGS, OR01: "Partially" }, { outlets: "2–5" });
    assert.ok(!content.noticed.some((n) => n.heading.startsWith("You have grown faster")));
  });

  it("shows the fallback alone when there is nothing to do", () => {
    const { content } = run(
      { ...STRINGS, SI01: "Yes", OR01: "Yes" },
      { outlets: "2–5" },
    );
    assert.equal(content.canDoNow?.actions.length, 0);
    assert.equal(content.canDoNow?.lead, null);
    assert.match(content.canDoNow?.fallback ?? "", /nothing outstanding/);
  });
});
