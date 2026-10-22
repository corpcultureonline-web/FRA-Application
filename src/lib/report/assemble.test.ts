/**
 * The Report assembly against the real libraries: every block it can choose
 * exists, the detector table in code is Group I's, and the absence rules
 * (Report library §4) hold — sections drop without renumbering, the lead does
 * not repeat in Section 05, and the strip agrees with the sections beneath it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { payableLabel, priceLabel } from "../pricing.ts";
import type { Answer, Answers } from "../questionnaire/rules.ts";
import { brandProfile, buildQuestionnaire, forBrand } from "../questionnaire/source.ts";
import type { AnswerMap, ScoringConfig } from "../scoring/engine.ts";
import { assembleReport, type ReportDocument, type Section } from "./assemble.ts";
import { buildContent, CONTENT_FILES, type ContentFiles } from "./content.ts";
import { DETECTORS } from "./detectors.ts";
import { applyEdits, pieces } from "./pieces.ts";
import { parsePoints, scoreReport } from "./engine.ts";

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
const files = Object.fromEntries(Object.entries(CONTENT_FILES).map(([name, file]) => [name, content(file)])) as ContentFiles;
const library = buildContent(files, config.pillars);

const n = (number: number): Answer => ({ option: null, number, escape: null, computed: false });
const opt = (option: number): Answer => ({ option, number: null, escape: null, computed: false });
const esc = (escape: Answer["escape"]): Answer => ({ option: null, number: null, escape, computed: false });
const option = (code: string, label: string) => {
  const index = questionnaire.questions.find((q) => q.code === code)!.options.indexOf(label);
  assert.ok(index >= 0, `${code} has no option "${label}"`);
  return opt(index);
};

/** Middle options, clean legals, no detector firing. */
function ordinary(): Answers {
  const answers: Answers = {};
  for (const q of questionnaire.questions) {
    if (q.type === "num") answers[q.code] = n(q.code === "BP3" ? 4.2 : q.code === "BP4" ? 300 : q.code === "FL5" ? 20 : 12);
    else answers[q.code] = opt(Math.floor(q.options.length / 2));
  }
  return { ...answers, G2: option("G2", "Yes"), G4: option("G4", "Yes"), G5: option("G5", "Yes") };
}

const audit: AnswerMap = {
  UE01: "18–24 months", UE02: "20–25%", OR01: "Partially", OR02: "Most", BP01: "16–40", MR01: "2–3",
  PP01: "No", SI01: "Partially", FL01: config.questions.find((q) => q.code === "FL01")!.options[2].label,
  G1: "Registered", G3: "No",
};

function build(answers: Answers, auditAnswers: AnswerMap = audit, outlets = "2–5"): ReportDocument {
  const score = scoreReport({ config, audit: auditAnswers, answers, points });
  return assembleReport({
    config,
    content: library,
    questions: questionnaire.questions,
    points,
    score,
    audit: auditAnswers,
    answers,
    profile: { brand: "Test Brand", category: "Food & Beverage", outlets, city: "Chennai", rangeLow: 50, rangeHigh: 67 },
    price: { headline: priceLabel("roadmap"), payable: payableLabel("roadmap") },
    now: new Date("2026-10-20T10:00:00+05:30"),
  });
}

const section = <N extends Section["number"]>(report: ReportDocument, number: N) =>
  report.sections.find((s) => s.number === number) as Extract<Section, { number: N }> | undefined;

describe("Report content: the libraries hold every block the assembly can choose", () => {
  it("the detector table in code is Group I §1.1's, id for id and priority for priority", () => {
    assert.deepEqual(
      DETECTORS.map((d) => [d.id, d.priority]),
      [...library.detectorTable].sort((a, b) => b[1] - a[1]),
    );
  });

  it("every detector except the fallback has its words, and the fallback has none", () => {
    for (const d of DETECTORS) assert.equal(library.blocks.has(d.id), d.kind !== "fallback", d.id);
  });

  it("21 gap-led leads, 35 diagnosis blocks, 21 gap lines, E1–E8, seven subtitles", () => {
    for (const p of config.pillars) {
      for (const sev of ["MAJ", "MOD", "MIN"]) assert.ok(library.blocks.get(`I-LEAD-${p.code}-${sev}`)?.length, `I-LEAD-${p.code}-${sev}`);
      for (const b of config.bands) assert.equal(library.diagnosis.get(`${p.code}:${b.code}`)?.length, 3, `${p.code} ${b.code}`);
      for (const sev of ["Major", "Moderate", "Minor"]) assert.ok(library.gapLines.get(`${p.code}:${sev}`), `${p.code} ${sev}`);
      assert.ok(library.subtitles.get(p.code), p.code);
    }
    for (let i = 1; i <= 8; i++) assert.ok(library.framing.get(`E${i}`)?.length, `E${i}`);
    assert.ok(library.blocks.get("I-LEAD-STRONG"));
  });

  it("every Section 05 block in all three states, the row titles and the ladder", () => {
    const ids = ["G1-CLEAR", "G1-FILED", "G1-NEITHER", "G2-CLEAR", "G2-PARTIAL", "G2-NO", "G2-DK", "G3-CLEAR", "G3-YES"];
    for (const id of [...ids, "G4-CLEAR", "G4-NO", "G4-DK", "G5-CLEAR", "G5-PARTIAL", "G5-NO", "G5-DK"]) {
      assert.ok(library.blocks.get(`I-NN-${id}`), id);
    }
    for (const g of ["G1", "G2", "G3", "G4", "G5"]) assert.ok(library.gateTitles.get(g), g);
    assert.equal(library.gateTitles.get("G3"), "Ownership disputes");
    for (let i = 1; i <= 5; i++) assert.ok(library.ladder.get(`LADDER-${i}`), `LADDER-${i}`);
    assert.ok(library.ladder.get("LADDER-INTRO"));
    assert.deepEqual(library.scale, ["NOT YET", "EARLY", "ALMOST", "READY", "SCALE"]);
  });

  it("a label for every question that lists in Section 06, headings for all ten sections, four tile templates", () => {
    // 41 labels (T123, T128, T135): every Report question but the gates, which render in Section 05, and every carried Audit answer.
    for (const q of fullSet.questions.filter((x) => !x.code.startsWith("G"))) assert.ok(library.labels.get(q.code), q.code);
    for (const q of config.questions.filter((x) => x.pillar)) assert.ok(library.labels.get(q.code), q.code);
    for (const gate of ["G2", "G4", "G5"]) assert.equal(library.labels.get(gate), undefined, gate);
    for (let i = 1; i <= 10; i++) assert.ok(library.keys.get(`T2R-SEC-${String(i).padStart(2, "0")}`), `T2R-SEC-${i}`);
    assert.deepEqual([...library.tiles.keys()], ["Your score", "Costliest gap", "Strongest pillar", "Must resolve"]);
    assert.equal(library.notAssessed?.length, 4);
  });

  it("Group I keys come from the Copy column, Source-tagged rows win, header notes are dropped", () => {
    assert.equal(library.keys.get("T2R-VSFREE"), "Against your free result");
    assert.equal(library.keys.get("T2R-MUSTRESOLVE"), "Must resolve");
    assert.equal(library.keys.get("T2R-INPROGRESS"), "In progress");
    assert.equal(library.keys.get("T2R-BIO-ROLE"), "Founder & CEO, Corporate Culture");
    assert.match(library.keys.get("T2R-DISCLAIMER")!, /^This report is based on the answers you provided/);
    assert.match(library.keys.get("T2R-05-INTRO")!, /^These are separate from your score/);
    assert.equal(library.keys.get("T2R-TH-SCORE100"), "Score out of 100");
  });

  it("T2R-FINAL comes from the library keys.json names as its owner", () => {
    assert.equal(library.keys.get("T2R-FINAL"), "Final · does not change");
  });
});

describe("Report assembly: the lead and where the rest go", () => {
  it("nothing fires: the costliest gap leads, only Section 02 is absent, and five gates show Clear", () => {
    const report = build(ordinary());
    assert.match(report.detectors.lead, /^I-LEAD-[A-Z]{2}-(MAJ|MOD|MIN)$/);
    assert.deepEqual(report.contents.map((c) => c.number), ["01", "03", "04", "05", "06", "07", "08", "09", "10"]);
    assert.equal(section(report, "03")!.noContradictions, library.keys.get("T2R-NOCONTRA"));
    const five = section(report, "05")!;
    assert.deepEqual(five.items.map((i) => i.state), ["clear", "clear", "clear", "clear", "clear"]);
    assert.ok(five.items.every((i) => i.marker === "Clear" && i.paragraphs?.length));
    assert.equal(report.glance[3].value, "Nothing");
  });

  it("an entity that cannot sign leads; Section 05 still lists it, marked as the hardest stop", () => {
    const report = build({ ...ordinary(), G2: option("G2", "No"), G4: option("G4", "No") });
    assert.equal(report.detectors.lead, "LF-NO-ENTITY");
    const five = section(report, "05")!;
    // Must resolve first, then In progress, then Clear; G1 to G5 within each (§4.7).
    assert.deepEqual(five.items.map((i) => i.id), ["I-NN-G2-NO", "I-NN-G4-NO", "I-NN-G1-CLEAR", "I-NN-G3-CLEAR", "I-NN-G5-CLEAR"]);
    assert.deepEqual(five.items.filter((i) => i.hardstop).map((i) => i.gate), ["G4"]);
    assert.equal(five.items.find((i) => i.gate === "G4")!.marker, library.keys.get("T2R-HARDSTOP"));
    assert.equal(report.glance[3].value, "2 items");
    assert.equal(report.glance[3].caption, "Your franchise agreement and your business entity.");
  });

  it("an agreement with no entity behind it is the contradiction, not the plain gate (§1.1)", () => {
    const report = build({ ...ordinary(), G2: option("G2", "Yes"), G4: option("G4", "No") });
    assert.equal(report.detectors.lead, "LF-PAPER-NO-ENTITY");
    assert.ok(!report.detectors.fired.includes("LF-NO-ENTITY"));
    assert.equal(section(report, "05")!.items.find((i) => i.gate === "G4")!.hardstop, true);
  });

  it("a contradiction below the lead goes to Section 02 with its intro counted", () => {
    const report = build(
      { ...ordinary(), MR2: option("MR2", "Anecdotal"), MR6: option("MR6", "Systematically"), G5: option("G5", "No") },
      { ...audit, G3: "Yes" },
    );
    assert.equal(report.detectors.lead, "LF-DISPUTE");
    const two = section(report, "02")!;
    assert.deepEqual(two.notes.map((note) => note.id), ["LF-DEMAND-UNREAD"]);
    // T124: one finding takes its own intro.
    assert.match(two.intro!, /^One more place where two of your answers point/);
    const five = section(report, "05")!;
    assert.deepEqual(five.items.slice(0, 2).map((i) => i.id), ["I-NN-G3-YES", "I-NN-G5-NO"]);
    assert.deepEqual(five.items.filter((i) => i.hardstop).map((i) => i.gate), ["G3"]);
    assert.equal(section(report, "03")!.noContradictions, null);
  });

  it("an application filed and a Partial are In progress: listed, never counted, never leading", () => {
    const report = build(
      { ...ordinary(), G2: option("G2", "Partial"), G4: esc("dont_know"), G5: option("G5", "Partial") },
      { ...audit, G1: "Application filed" },
    );
    assert.match(report.detectors.lead, /^I-LEAD-/);
    const five = section(report, "05")!;
    assert.deepEqual(
      five.items.map((i) => [i.id, i.state]),
      [
        ["I-NN-G4-DK", "mustresolve"],
        ["I-NN-G1-FILED", "inprogress"],
        ["I-NN-G2-PARTIAL", "inprogress"],
        ["I-NN-G5-PARTIAL", "inprogress"],
        ["I-NN-G3-CLEAR", "clear"],
      ],
    );
    // No detector fires on "I don't know", so nothing carries the hardest-stop marker.
    assert.ok(five.items.every((i) => !i.hardstop));
    assert.equal(report.glance[3].value, "1 item");
    assert.equal(report.glance[3].caption, "Your business entity.");
  });

  it("three \"I don't know\" answers fire the measurement finding (T44, T100)", () => {
    const report = build({ ...ordinary(), G2: esc("dont_know"), G4: esc("dont_know"), G5: esc("dont_know") });
    assert.ok(report.detectors.fired.includes("LF-UNMEASURED"));
    const finding = report.detectors.lead === "LF-UNMEASURED" ? section(report, "01")!.lead : section(report, "02")!.notes[0];
    assert.match(finding.paragraphs![1], /You answered \*I don't know\* to three questions/);
  });

  it("the thin-base finding carries the founder's own figures", () => {
    const report = build({ ...ordinary(), BP3: n(4.8), BP4: n(12) }, { ...audit, G3: "Yes" });
    const note = section(report, "02")!.notes.find((x) => x.id === "LF-THIN-BASE")!;
    assert.match(note.paragraphs![0], /A 4\.8 rating from 12 reviews/);
  });

  it("the margins matching leads when nothing above it fires", () => {
    const report = build({ ...ordinary(), UE7: n(22), UE8: option("UE8", "Profitable for 2+ years"), FL3: opt(4) });
    assert.equal(report.detectors.lead, "LF-TWO-MARGINS");
  });

  it("Section 02 holds at most four", () => {
    const report = build(
      {
        ...ordinary(),
        UE7: n(22), UE8: option("UE8", "Loss-making"), PP6b: option("PP6b", "Yes"),
        FL4: opt(4), FL5: n(0), OR4: option("OR4", "No"), MR2: option("MR2", "Anecdotal"), MR6: option("MR6", "Systematically"),
        BP3: n(4.9), BP4: n(10),
      },
      { ...audit, OR01: "Yes" },
    );
    assert.equal(report.detectors.lead, "LF-FEE-ON-SAND");
    assert.deepEqual(section(report, "02")!.notes.map((x) => x.id), ["LF-TWO-MARGINS", "LF-RATED-NOT-RUN", "LF-SYSTEM-UNCHECKED", "LF-DEMAND-UNREAD"]);
    assert.match(section(report, "02")!.intro!, /^Four more places/);
  });
});

describe("Report assembly: derived, never written", () => {
  it("the strip agrees with the sections beneath it", () => {
    const report = build(ordinary());
    const four = section(report, "04")!;
    assert.equal(report.glance[1].value, four.gaps[0].displayName);
    assert.equal(report.glance[1].caption, `Scored ${four.gaps[0].score}, at ${four.gaps[0].weight}% of your result.`);
    const best = [...section(report, "06")!.pillars].sort((a, b) => Number(b.score) - Number(a.score))[0];
    assert.equal(Number(report.glance[2].caption!.match(/Scored ([\d.]+)/)![1]), Number(best.score));
    assert.equal(report.glance[0].value, `${report.cover.overall} / 100`);
  });

  it("the question count is computed, never a literal (T99)", () => {
    const report = build(ordinary());
    const total = questionnaire.questions.length + Object.keys(audit).filter((code) => config.questions.some((q) => q.code === code)).length;
    assert.match(report.intro![0], new RegExp(`based on the ${total} questions`));
    assert.match(section(report, "03")!.comparison.paragraphs[0]!, new RegExp(`All \\*\\*${total}\\*\\* place you`));
    assert.equal(report.cover.explanation, `Seven pillars, each weighted by how much it decides franchise success rather than business success. The full set of answers places you at ${report.cover.overall}.`);
  });

  it("the comparison panel gives both distances, and they span the band", () => {
    const report = build(ordinary());
    const band = section(report, "03")!.comparison.paragraphs.at(-1)!;
    const [, above, below] = /([\d.]+) points above the level below and ([\d.]+) below/.exec(band)!;
    const i = config.bands.findIndex((b) => b.code === report.cover.band.code);
    const width = Number(config.bands[i].max) - Number(i ? config.bands[i - 1].max : 0);
    assert.equal(Math.round((Number(above) + Number(below)) * 10) / 10, width);
  });

  it("the top and bottom bands take their own frames (§3.1)", () => {
    const top: Answers = {};
    const bottom: Answers = {};
    for (const q of questionnaire.questions) {
      const rule = points.get(q.code);
      if (q.type === "num") {
        top[q.code] = n(q.code === "BP3" ? 4.5 : q.code === "BP4" ? 900 : q.code === "FL5" ? 90 : 30);
        bottom[q.code] = n(q.code === "BP3" ? 3.0 : q.code === "BP4" ? 5 : q.code === "FL5" ? 0 : 1);
      } else if (rule?.kind === "options") {
        const best = rule.points.indexOf(Math.max(...rule.points.filter((p): p is number => p !== null)));
        const worst = rule.points.indexOf(Math.min(...rule.points.filter((p): p is number => p !== null)));
        top[q.code] = opt(best);
        bottom[q.code] = opt(worst);
      } else {
        top[q.code] = option(q.code, "Yes");
        bottom[q.code] = option(q.code, "Yes");
      }
    }
    const best = Object.fromEntries(config.questions.map((q) => [q.code, [...q.options].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0].label]));
    const worst = Object.fromEntries(config.questions.map((q) => [q.code, [...q.options].sort((a, b) => (a.value ?? 9) - (b.value ?? 9))[0].label]));
    const high = build(top, { ...best, G1: "Registered", G3: "No" });
    const low = build(bottom, { ...worst, G1: "Registered", G3: "No" });
    assert.equal(high.cover.band.code, "B5");
    assert.match(section(high, "03")!.comparison.paragraphs.at(-1)!, /the highest level this assessment awards/);
    assert.equal(low.cover.band.code, "B1");
    assert.match(section(low, "03")!.comparison.paragraphs.at(-1)!, /the lowest level — \*\*[\d.]+ points below Early Stage/);
  });

  it("moved-down and moved-up name labels from Group I §5, at most three each", () => {
    const report = build({ ...ordinary(), PP2: option("PP2", "No"), MR3: option("MR3", "No"), OR3: option("OR3", "Yes") });
    const [, down, up] = section(report, "03")!.comparison.paragraphs;
    assert.match(down!, /answers moved it down: /);
    assert.match(up!, /moved it up: /);
    assert.ok(down!.includes("franchisee selection process"));
  });

  it("no placeholder survives into the text", () => {
    for (const answers of [ordinary(), { ...ordinary(), BP3: n(4.8), BP4: n(12), G4: option("G4", "No") }]) {
      const text = JSON.stringify(build(answers));
      assert.doesNotMatch(text, /\{[a-z_]+\}|\{Pillar\}|\{Section 05/);
    }
  });

  it("the Roadmap price is the config's, and E6's literal title price is not carried", () => {
    const ten = section(build(ordinary()), "10")!;
    assert.equal(ten.price.payable, payableLabel("roadmap"));
    assert.equal(ten.heading, "The Franchise Readiness Roadmap");
    assert.deepEqual(ten.reviewer.stats.map((s) => s.value), ["₹100+ Cr", "500+", "50+", "20+"]);
  });

  it("the not-assessed block is ready for T46 (unreachable today, T81)", () => {
    assert.match(library.notAssessed![0], /\{Pillar\} — not assessed/);
  });

  it("every string the Report needs is in the libraries (Group I v1.17, Report v1.11)", () => {
    for (const answers of [ordinary(), { ...ordinary(), G2: option("G2", "No"), G4: option("G4", "No") }]) {
      assert.deepEqual(build(answers).missing, []);
    }
    assert.ok(build(ordinary()).flags.some((f) => f.startsWith("E6 is the stale version")));
  });

  it("Section 06 prints each answer as the founder saw it (Group I §5.0, T135)", () => {
    const report = build({ ...ordinary(), UE7: n(9), BP4: n(1200), FL5: n(75), MR5: n(3), OR5: opt(3) });
    const six = section(report, "06")!;
    const item = (code: string) => six.pillars.flatMap((p) => p.toldUs).find((i) => i.code === code)!;
    assert.deepEqual([item("UE7").label, item("UE7").answer], ["Company EBITDA margin", "9%"]);
    assert.equal(item("BP4").answer, "1,200");
    assert.equal(item("FL5").answer, "75 of 90 days");
    assert.deepEqual([item("MR5").label, item("MR5").answer], ["Outlets trading", "3"]);
    // Anchored: the option's first sentence, verbatim — a prefix of the option chosen.
    const or5 = questionnaire.questions.find((q) => q.code === "OR5")!.options[3];
    assert.ok(or5.startsWith(item("OR5").answer));
    assert.match(item("OR5").answer, /\.$/);
    // Carried Audit answers: labelled and tagged.
    assert.deepEqual([item("UE01").audit, item("UE01").label, item("UE01").answer], [true, "Outlet payback period", "18–24 months"]);
    assert.equal(item("FL01").label, "Decision-making authority");
    assert.ok(config.questions.find((q) => q.code === "FL01")!.options[2].label.startsWith(item("FL01").answer));
  });

  it("one answer either way takes the singular frame (T124)", () => {
    const report = build({ ...ordinary(), PP2: option("PP2", "No") });
    const lines = section(report, "03")!.comparison.paragraphs.filter(Boolean) as string[];
    for (const line of lines) assert.doesNotMatch(line, /^One answers/);
  });

  it("Section 10 asks about the Roadmap; it does not sell it (T127)", () => {
    const ten = section(build(ordinary()), "10")!;
    assert.equal(ten.cta, "**Tell me about the Roadmap**");
    assert.equal(ten.ctaSub, "The Roadmap opens shortly. Register now and we will come to you first.");
    assert.equal(ten.ctaDone, "**You're on the list.** We will be in touch within one working day.");
  });
});

describe("Report pieces: what the review panel can edit (Admin §3)", () => {
  const report = build({ ...ordinary(), G2: option("G2", "No"), G4: option("G4", "No"), MR2: option("MR2", "Anecdotal"), MR6: option("MR6", "Systematically") });

  it("every prose block has one slot, unique, with the library piece that filled it", () => {
    const list = pieces(report);
    const slots = list.map((p) => p.slot);
    assert.equal(new Set(slots).size, slots.length);
    for (const slot of ["intro", "01.lead", "03.compare", "04.framing", "05.G1", "05.G5", "06.UE", "06.PP", "08", "09", "10"]) {
      assert.ok(slots.includes(slot), slot);
    }
    assert.equal(list.find((p) => p.slot === "01.lead")!.pieceId, "LF-NO-ENTITY");
    assert.match(list.find((p) => p.slot === "06.UE")!.pieceId, /^C-UE-B[1-5]$/);
    assert.match(list.find((p) => p.slot.startsWith("04.") && p.slot !== "04.framing")!.pieceId, /^D-[A-Z]{2}-(MAJ|MOD|MIN)$/);
  });

  it("an edit replaces only its slot, and the generated Report is untouched (T70)", () => {
    const before = JSON.stringify(report);
    const edited = applyEdits(report, new Map([["06.UE", ["A reviewer's sentence."]], ["04.UE", ["A reviewer's gap line."]]]));
    assert.equal(JSON.stringify(report), before);
    const six = edited.sections.find((s) => s.number === "06") as Extract<Section, { number: "06" }>;
    assert.deepEqual(six.pillars.find((p) => p.code === "UE")!.paragraphs, ["A reviewer's sentence."]);
    assert.deepEqual(six.pillars.find((p) => p.code === "OR")!.paragraphs, (report.sections.find((s) => s.number === "06") as typeof six).pillars.find((p) => p.code === "OR")!.paragraphs);
    const four = edited.sections.find((s) => s.number === "04") as Extract<Section, { number: "04" }>;
    const gap = four.gaps.find((g) => g.code === "UE");
    if (gap) assert.equal(gap.line, "A reviewer's gap line.");
    assert.equal(edited.cover.overall, report.cover.overall);
  });

  it("an edit for a slot the Report does not have is ignored, not invented", () => {
    const edited = applyEdits(report, new Map([["02.LF-NOT-HERE", ["x"]]]));
    assert.equal(JSON.stringify(edited).includes('"x"'), false);
  });
});
