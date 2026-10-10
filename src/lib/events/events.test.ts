/**
 * Event log rules (Event-Log-Spec v1.0): what /api/event accepts, the clock
 * rule, no personal data, and no overall score in any server payload.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import seed from "../../../database/seed/tier1-scoring-config.json" with { type: "json" };
import { score, type ScoringConfig } from "../scoring/engine.ts";
import { toFixed } from "../scoring/rational.ts";
import { VECTORS } from "../scoring/test-vectors.ts";
import { CLOCK_TOLERANCE_MS, MAX_EVENTS_PER_BATCH, parseBatch } from "./batch.ts";
import { auditScoredPayload, withAnswerValues } from "./payloads.ts";

const config = seed as ScoringConfig;
const SID = "6f1c2b7e-1d2a-4b3c-9d4e-5f6a7b8c9d0e";
const NOW = 1_760_000_000_000;
const batch = (events: unknown[], sessionId: unknown = SID) => JSON.stringify({ session_id: sessionId, events });

describe("/api/event batches (§3)", () => {
  it("rejects a malformed body without throwing", () => {
    for (const raw of ["", "not json", "[]", "null", batch([], "not-a-uuid"), JSON.stringify({ session_id: SID })]) {
      assert.equal(parseBatch(raw, NOW), null, raw);
    }
  });

  it("keeps client events and drops server-only or unknown types", () => {
    const parsed = parseBatch(
      batch([
        { type: "question_answered", at: NOW, payload: { code: "UE01", label: "12–18 months" } },
        { type: "audit_scored", at: NOW, payload: { band: "READY_TO_SCALE" } },
        { type: "zoho_push", at: NOW, payload: {} },
        { type: "made_up", at: NOW },
        { type: "page_exit", at: NOW, payload: ["not", "an", "object"] },
      ]),
      NOW,
    )!;
    assert.deepEqual(parsed.events.map((e) => e.type), ["question_answered"]);
    assert.equal(parsed.rejected, 4);
  });

  it("caps a batch at the maximum size", () => {
    const many = Array.from({ length: MAX_EVENTS_PER_BATCH + 20 }, () => ({ type: "cta_clicked", at: NOW }));
    const parsed = parseBatch(batch(many), NOW)!;
    assert.equal(parsed.events.length, MAX_EVENTS_PER_BATCH);
    assert.equal(parsed.rejected, 20);
  });

  it("uses the client's time, unless it is missing or more than an hour out", () => {
    const parsed = parseBatch(
      batch([
        { type: "cta_clicked", at: NOW - 5000 },
        { type: "cta_clicked" },
        { type: "cta_clicked", at: NOW + CLOCK_TOLERANCE_MS + 1 },
      ]),
      NOW,
    )!;
    assert.equal(parsed.events[0].at, NOW - 5000);
    assert.equal(parsed.events[0].payload.clock_suspect, undefined);
    for (const event of parsed.events.slice(1)) {
      assert.equal(event.at, NOW);
      assert.equal(event.payload.clock_suspect, true);
    }
  });

  it("stores no personal data and no report token (§8)", () => {
    const parsed = parseBatch(
      batch([
        {
          type: "page_exit",
          at: NOW,
          payload: {
            path: "/franchise-audit/audit/report/61e9ce8c2f88aa9a9ce0a0e67e038d3f",
            email: "anita@strings.in",
            brandName: "Strings",
            note: "call me on +91 80728 30857 or anita@strings.in",
          },
        },
      ]),
      NOW,
    )!;
    const json = JSON.stringify(parsed.events[0].payload);
    for (const leaked of ["61e9ce8c", "anita@", "Strings", "30857"]) assert.ok(!json.includes(leaked), `${leaked} in ${json}`);
    assert.match(json, /\/franchise-audit\/audit\/report\/\[token\]/);
  });
});

describe("server payloads", () => {
  for (const v of VECTORS) {
    it(`${v.brand}: audit_scored holds band and range, never the overall score`, () => {
      const result = score(config, v.answers);
      const payload = auditScoredPayload(config, result, v.answers);
      const json = JSON.stringify(payload);
      const overall = toFixed(result.overall, 2);
      for (const form of [overall, String(Number(overall))]) assert.ok(!json.includes(form), `overall ${form} in ${json}`);
      assert.ok(!/overall|weight|"score"/i.test(json), json);
      assert.deepEqual(Object.keys(payload).sort(), [
        "band", "band_count", "capped", "gate_g1", "gate_g3", "high", "low", "weak_count", "weakest_pillar",
      ]);
      assert.equal(payload.low, v.range[0]);
      assert.equal(payload.high, v.range[1]);
    });
  }

  it("adds option values server-side; gates have none", () => {
    assert.equal(withAnswerValues(config, "question_answered", { code: "UE01", label: "12–18 months" }).value, 4);
    assert.equal(withAnswerValues(config, "question_answered", { code: "G1", label: "Neither" }).value, null);
    const changed = withAnswerValues(config, "answer_changed", { code: "UE02", from_label: "15–20%", to_label: "10–15%" });
    assert.equal(changed.from_value, 3);
    assert.equal(changed.to_value, 2);
    assert.deepEqual(withAnswerValues(config, "cta_clicked", { cta: "x" }), { cta: "x" });
  });
});
