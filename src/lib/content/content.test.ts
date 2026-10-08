/**
 * Content Library v1.7 selection and the Tier 1 report, through the same
 * buildReport pipeline the result page and PDF use. The Strings case
 * reproduces Content Library §11/§15: its triggers land on the observations
 * written by hand for that brand. The leak tests are Pre-Launch Step 4.
 *
 * Run with `npm test`.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import scoringSeed from "../../../database/seed/tier1-scoring-config.json" with { type: "json" };
import contentSeed from "../../../database/seed/tier1-content.json" with { type: "json" };
import type { Profile } from "../audit.ts";
import { buildReport } from "../result.ts";
import { score, type AnswerMap, type ScoringConfig } from "../scoring/engine.ts";
import { toPublicScore } from "../scoring/public.ts";
import { toFixed } from "../scoring/rational.ts";
import { THREE_BANDS, VECTORS } from "../scoring/test-vectors.ts";
import { fraResult, toRecord } from "../zoho.ts";
import { OUTLET_BANDS } from "./facts.ts";
import { fillSlots, SLOTS, type ContentPiece, type SlotValues } from "./select.ts";
import { evaluate, parseTrigger, type Facts } from "./triggers.ts";

const config = scoringSeed as ScoringConfig;

const pieces: ContentPiece[] = contentSeed.pieces.map((p) => ({
  id: p.id,
  section: p.section,
  note_type: ("note_type" in p ? p.note_type : null) as ContentPiece["note_type"],
  priority: p.priority,
  trigger_expr: p.trigger,
  heading: "heading" in p ? (p.heading as string) : null,
  body: p.body,
  active: !("active" in p && p.active === false),
}));

const vector = (brand: string) => VECTORS.find((v) => v.brand === brand)!.answers;

function report(answers: AnswerMap, profile: Partial<Profile> = {}) {
  const errors: string[] = [];
  const data = buildReport({
    token: "0".repeat(32),
    profile: {
      brandName: "Test Brand",
      founderName: "Founder",
      email: "founder@example.com",
      category: "Services",
      outlets: "1",
      city: "Chennai",
      ...profile,
    },
    answers,
    submittedAt: new Date("2026-10-08"),
    config,
    activeConfig: config,
    pieces,
    interested: false,
    phoneGiven: false,
    onError: (m) => errors.push(m),
  });
  return { data, content: data.content, errors };
}

describe("trigger grammar", () => {
  const facts: Facts = { UE01: 4, OR01: null, outlets_band: "TWO_TO_FIVE", G1: "Neither", band: "ALMOST_READY" };
  const check = (expr: string) => evaluate(parseTrigger(expr), facts);

  it("evaluates ALWAYS, comparisons and IN", () => {
    assert.equal(check("ALWAYS"), true);
    assert.equal(check("UE01 == 4"), true);
    assert.equal(check("UE01 >= 5"), false);
    assert.equal(check("UE01 IN (3, 4)"), true);
    assert.equal(check("G1 == 'Neither'"), true);
  });

  it("makes every condition on a NULL field false, including != and >= 1", () => {
    assert.equal(check("OR01 == 5"), false);
    assert.equal(check("OR01 != 5"), false);
    assert.equal(check("OR01 >= 1"), false);
  });

  it("binds AND tighter than OR", () => {
    assert.equal(check("UE01 == 1 AND OR01 == 1 OR band == 'ALMOST_READY'"), true);
    assert.equal(check("UE01 == 4 OR UE01 == 1 AND band == 'NOPE'"), true);
  });

  it("compares the outlet band as text, never as a number", () => {
    assert.equal(check("outlets_band != 'ONE'"), true);
    assert.equal(check("outlets_band IN ('ONE', 'TWO_TO_FIVE')"), true);
    assert.equal(check("outlets_band >= 2"), false);
  });

  it("rejects unknown fields and malformed input", () => {
    assert.throws(() => parseTrigger("overall >= 50"));
    assert.throws(() => parseTrigger("outlets == '1'"));
    assert.throws(() => parseTrigger("UE01 != NULL"));
    assert.throws(() => parseTrigger("UE01 = 4"));
  });
});

describe("slots", () => {
  it("has no {overall}, {outlets} or {year_opened} slot", () => {
    for (const name of ["overall", "outlets", "year_opened"]) {
      assert.throws(() => fillSlots(`{${name}}`, { low: "56" }), name);
    }
  });

  it("skips a piece whose slot has no value", () => {
    assert.equal(fillSlots("Tested in {MR01_label}", {}), null);
    assert.equal(fillSlots("{low} to {high}", { low: "56", high: "73" }), "56 to 73");
  });
});

describe("seed data", () => {
  it("parses every trigger and uses only known slots", () => {
    const all = Object.fromEntries(SLOTS.map((s) => [s, "x"])) as SlotValues;
    for (const piece of pieces) {
      assert.doesNotThrow(() => parseTrigger(piece.trigger_expr), piece.id);
      assert.doesNotThrow(() => fillSlots(piece.body, all), piece.id);
      if (piece.heading) assert.doesNotThrow(() => fillSlots(piece.heading!, all), piece.id);
    }
  });

  it("has unique ids, and A3, A4 and A5-CLEAN inactive", () => {
    assert.equal(new Set(pieces.map((p) => p.id)).size, pieces.length);
    const inactive = pieces.filter((p) => !p.active).map((p) => p.id);
    assert.equal(inactive.length, 13);
    assert.ok(inactive.includes("A5-CLEAN"));
    assert.ok(inactive.every((id) => /^A[345]-/.test(id)));
  });

  it("has a restatement for every scored option and every outlet band", () => {
    for (const q of config.questions.filter((q) => q.pillar)) {
      for (const o of q.options) assert.ok(o.restatement, `${q.code} ${o.label}`);
    }
    const outlets = config.profile?.outlets?.map((o) => o.label) ?? [];
    assert.deepEqual(outlets.sort(), Object.keys(OUTLET_BANDS).sort());
  });
});

describe("Strings (Content Library §15)", () => {
  const { data, content, errors } = report(vector("Strings"));

  it("logs no content errors", () => assert.deepEqual(errors, []));

  it("shows the score box and badge", () => {
    assert.equal(data.badge, "Almost Ready – Early Stage");
    assert.equal(content.gateReason, null);
    assert.deepEqual(content.scoreNote, [
      "This is a range, not one number. Eleven questions can tell us roughly where you stand, but not exactly.",
      "You have built more structure than most businesses at your stage, and the full report tells you exactly where that places you.",
    ]);
  });

  it("restates the answers from templates", () => {
    assert.deepEqual(content.toldUs, [
      "You operate **one outlet**, in **Chennai**",
      "Your outlet earns back its cost in **12 to 18 months**, at a margin of **15 to 20%**",
      "Your operating procedures are **written down**, and **most** core workflows have an SOP a new manager could follow",
      "You **know** what kind of franchise partner you want",
      "A training programme for new franchise owners is **partly built**",
      "**A manager runs the day to day within limits you have set**",
      "The model has been tested in **one city**",
      "**1 to 5 people** asked you about a franchise last year",
    ]);
  });

  it("selects the hand-written observations, with no legal finding", () => {
    assert.deepEqual(
      content.noticed.map((n) => n.heading),
      [
        "You have built the structure before the scale.",
        "Your next milestone is a second outlet you run yourself.",
        "Your numbers are steady rather than stretched.",
      ],
    );
  });

  it("builds the remaining sections", () => {
    assert.equal(content.importantPoints.length, 6);
    assert.match(content.importantPoints[0].text, /operating procedures are written down/);
    assert.deepEqual(
      content.legal.map((n) => n.text.split("**")[1]),
      ["Trademark application filed.", "No legal disputes."],
    );
    assert.equal(data.areas.find((a) => a.code === "OR")?.question, "Can someone else run it like you do?");
    assert.equal(content.nutshell.length, 5);
    assert.deepEqual(
      content.cannotTell?.items.map((i) => i.heading),
      ["Are you at 56, or at 73?", "Would this work where nobody knows your name?", "Which of your two weaker areas to work on first?"],
    );
    assert.match(content.cannotTell?.intro ?? "", /^You answered eleven questions/);
    assert.equal(content.ladder.close, "Your score range of 56 to 73 covers these two levels.");
    assert.match(content.canDoNow?.lead ?? "", /trademark application is filed/);
    assert.deepEqual(
      content.canDoNow?.actions.map((a) => a.heading),
      ["Finish the training programme.", "Open or plan your second outlet."],
    );
    assert.match(content.upgrade?.body ?? "", /₹1,999 \+ 18% GST\*\* · ₹2,359 payable/);
  });
});

describe("gates", () => {
  it("names a trademark cap in exactly three places (Career Craft)", () => {
    const { data, content } = report(vector("Career Craft"));
    assert.equal(data.badge, "Early Stage");
    assert.match(content.gateReason ?? "", /not yet trademarked/);
    assert.match(content.scoreNote[1], /^You have a working business/);
    assert.match(content.legal[0].text, /^\*\*No trademark registered or filed/);
    assert.match(content.canDoNow?.lead ?? "", /holding your result down/);
    assert.equal(content.canDoNow?.actions[0].heading, "File your trademark.");
    assert.ok(!content.noticed.some((n) => /trademark/i.test(n.heading + n.body)));
    // The range itself still touches two bands, even though the badge is capped.
    assert.equal(content.ladder.close, "Your score range of 54 to 71 covers these two levels.");
  });

  it("puts an active dispute first everywhere", () => {
    const { data, content } = report({ ...vector("Strings"), G3: "Yes" });
    assert.equal(data.badge, "Not Yet Ready");
    assert.match(content.gateReason ?? "", /unresolved legal matter/);
    assert.match(content.legal[0].text, /^\*\*An unresolved dispute/);
    assert.match(content.canDoNow?.lead ?? "", /^One thing has to be settled/);
    assert.equal(content.canDoNow?.actions[0].heading, "Resolve the dispute.");
  });
});

describe("range and weak-area variants", () => {
  it("names only the outer two bands when the range touches three", () => {
    const { data, content } = report(THREE_BANDS);
    assert.equal(data.badge, "Ready to Plan – Early Stage");
    assert.equal(data.ladder.filter((b) => b.yours).length, 3);
    assert.match(content.ladder.close ?? "", /^Your score range of 60 to 76 is wide enough to touch three levels/);
  });

  it("handles no weak areas (QB365)", () => {
    const { content } = report(vector("QB365"), { outlets: "2–5" });
    assert.equal(content.cannotTell?.items[2].heading, "Nothing here is weak. So what is actually holding you back?");
  });

  it("handles exactly one weak area", () => {
    const { content } = report(vector("da' mushroom"), { outlets: "2–5" });
    assert.equal(content.cannotTell?.items[2].heading, "How deep does the one gap actually run?");
  });
});

describe("outlet band", () => {
  it("treats every band other than ONE as more than one outlet", () => {
    for (const outlets of ["2–5", "6–15", "16+"]) {
      const { content } = report({ ...vector("Strings"), OR01: "Partially" }, { outlets });
      assert.equal(content.noticed[0].heading, "You have grown faster than you have written things down.", outlets);
      assert.ok(!content.noticed.some((n) => n.heading.includes("second outlet")), outlets);
      assert.match(content.toldUs[0], new RegExp(`\\*\\*${outlets.replace("+", "\\+")} outlets\\*\\*`));
    }
  });

  it("shows the fallback alone, without the lead, when there is nothing to do", () => {
    const { content } = report({ ...vector("Strings"), SI01: "Yes" }, { outlets: "2–5" });
    assert.deepEqual(content.canDoNow?.actions, []);
    assert.equal(content.canDoNow?.lead, null);
    assert.match(content.canDoNow?.fallback ?? "", /nothing outstanding/);
  });
});

describe("the overall score never leaves the server (Pre-Launch Step 4)", () => {
  const cases = [...VECTORS.map((v) => [v.brand, v.answers] as const), ["Three bands", THREE_BANDS] as const];

  for (const [brand, answers] of cases) {
    const result = score(config, answers);
    const overall = toFixed(result.overall, 2); // e.g. "64.40"
    const forms = [overall, String(Number(overall)), Number(overall).toFixed(1)];

    it(`${brand}: the result page / PDF data holds no overall or pillar score`, () => {
      const json = JSON.stringify(report(answers).data);
      for (const form of forms) assert.ok(!json.includes(form), `overall ${form} present`);
      // No overall, pillar score or weight field in any form.
      assert.ok(!/overall|weight|"score"/i.test(json), "score field present");
    });

    it(`${brand}: the Zoho payload holds no overall score`, () => {
      const json = JSON.stringify(
        toRecord({
          brandName: "B",
          founderName: "F",
          email: "e@x.co",
          result: fraResult(toPublicScore(config, result), "https://example.com/api/report/x"),
        }),
      );
      for (const form of forms) assert.ok(!json.includes(form), `overall ${form} present`);
      assert.ok(!/overall|weight/i.test(json));
    });
  }
});
