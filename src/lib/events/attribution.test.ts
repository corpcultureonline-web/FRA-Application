/**
 * Attribution and identity rules (Developer-Handoff-Identity-Attribution,
 * 20 Nov 2026): §3 normalisation and channels, §5 states, §7 hashing, and the
 * acceptance cases of §9 that need no database.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { funnelPosition } from "../analytics/funnel.ts";
import { campaignSignature, classify, hasCampaign, MALFORMED, normaliseMedium, normaliseSource } from "./attribution.ts";
import { contactHashes, flagsOnEntering, isForward, normaliseEmail, normalisePhone } from "./identity-rules.ts";
import { parseBatch } from "./batch.ts";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

describe("normalisation (§3.2)", () => {
  it("folds the five platform spellings into two", () => {
    for (const raw of ["ig", "Instagram", "instagram", " IG "]) assert.equal(normaliseSource(raw), "instagram");
    for (const raw of ["fb", "facebook", "Facebook"]) assert.equal(normaliseSource(raw), "facebook");
    assert.equal(normaliseSource("Google"), "google");
    assert.equal(normaliseSource("  Newsletter "), "newsletter");
    assert.equal(normaliseSource(""), null);
  });

  it("maps paid mediums, and never maps the malformed one to a real value (§9.10)", () => {
    assert.equal(normaliseMedium("paid"), "paid_social");
    assert.equal(normaliseMedium("paid_social"), "paid_social");
    assert.equal(normaliseMedium("social"), "organic_social");
    assert.equal(normaliseMedium("utm_medium"), MALFORMED);
    assert.equal(normaliseMedium("CPC"), "cpc");
  });
});

describe("channels (§3.4)", () => {
  it("classifies an ig/paid visit with an fbclid as Meta Paid (§9.2)", () => {
    const { touch } = classify({ utm_source: "ig", utm_medium: "paid", fbclid: "xyz" });
    assert.equal(touch.channel, "Meta Paid");
    assert.equal(touch.source, "instagram");
    assert.equal(touch.medium, "paid_social");
    assert.deepEqual([touch.click_id, touch.click_id_type], ["xyz", "fbclid"]);
  });

  it("keeps the malformed ad's campaign and still credits Meta", () => {
    const { touch } = classify({ utm_source: "Instagram", utm_medium: "utm_medium", utm_campaign: "campaign.traffic" });
    assert.equal(touch.channel, "Meta Paid");
    assert.equal(touch.medium, MALFORMED);
    assert.equal(touch.campaign, "campaign.traffic");
  });

  it("rescues a visit with no UTMs from instagram.com as Organic Social, not Direct (§9.4)", () => {
    assert.equal(classify({ referrer: "https://l.instagram.com/" }).touch.channel, "Organic Social");
    assert.equal(classify({ referrer: "https://www.instagram.com/" }).touch.channel, "Organic Social");
  });

  it("does not let our own domain reset attribution (§9.5)", () => {
    for (const referrer of ["https://corpculture.co/why-businesses-fail-to-scale/", "https://app.corpculture.co/franchise-audit"]) {
      const { touch, selfReferral } = classify({ referrer });
      assert.equal(touch.channel, "Direct");
      assert.equal(selfReferral, true, referrer);
    }
    // A campaign on the link is a new touch, not a self-referral.
    assert.equal(classify({ referrer: "https://corpculture.co/", utm_source: "newsletter", utm_medium: "email" }).selfReferral, false);
  });

  it("applies the rules in order", () => {
    assert.equal(classify({ gclid: "abc" }).touch.channel, "Google Paid");
    assert.equal(classify({ utm_source: "google", utm_medium: "cpc" }).touch.channel, "Google Paid");
    assert.equal(classify({ utm_source: "zoho", utm_medium: "email" }).touch.channel, "Owned");
    assert.equal(classify({ utm_medium: "whatsapp" }).touch.channel, "Owned");
    assert.equal(classify({ referrer: "https://www.google.co.in/" }).touch.channel, "Organic Search");
    assert.equal(classify({ referrer: "https://www.bing.com/search" }).touch.channel, "Organic Search");
    assert.equal(classify({ referrer: "https://example.org/list" }).touch.channel, "Referral");
    assert.equal(classify({}).touch.channel, "Direct");
  });

  it("keeps Google's search partners visible: Google Paid with a click ID, else Referral", () => {
    assert.equal(classify({ referrer: "https://syndicatedsearch.goog/" }).touch.channel, "Referral");
    assert.equal(classify({ referrer: "https://syndicatedsearch.goog/", gclid: "g1" }).touch.channel, "Google Paid");
  });

  it("knows a campaign click, and tells two apart (§4)", () => {
    assert.equal(hasCampaign({ referrer: "https://instagram.com/" }), false);
    assert.equal(hasCampaign({ fbclid: "x" }), true);
    const first = campaignSignature(new URLSearchParams("utm_source=ig&utm_campaign=a"));
    assert.equal(campaignSignature(new URLSearchParams("utm_campaign=a&utm_source=ig")), first);
    assert.notEqual(campaignSignature(new URLSearchParams("utm_source=ig&utm_campaign=b")), first);
    assert.equal(campaignSignature(new URLSearchParams("audit=abc")), null);
  });
});

describe("identity (§5, §7)", () => {
  it("hashes the same contact the same way on every device", () => {
    assert.equal(normalisePhone("98765 43210"), "+919876543210");
    assert.equal(normalisePhone("+91 98765-43210"), "+919876543210");
    assert.equal(normalisePhone("09876543210"), "+919876543210");
    assert.equal(normaliseEmail("  Founder@Brand.IN "), "founder@brand.in");
    const a = contactHashes({ phone: "9876543210", email: "Founder@Brand.in" });
    const b = contactHashes({ phone: "+91 98765 43210", email: " founder@brand.in" });
    assert.deepEqual(a, b);
    assert.equal(a.phoneHash, sha("+919876543210"));
    assert.equal(contactHashes({}).phoneHash, null);
  });

  it("only ever moves a person forward", () => {
    assert.equal(isForward(null, "user"), true);
    assert.equal(isForward("user", "participant"), true);
    assert.equal(isForward("participant", "client"), true);
    assert.equal(isForward("customer", "participant"), false);
    assert.equal(isForward("client", "client"), false);
  });

  it("settles the flags each state answers (§5.2)", () => {
    assert.deepEqual(flagsOnEntering("customer").set, { upgrade_clicked_unpaid: false, paid_questions_incomplete: true });
    assert.deepEqual(flagsOnEntering("participant").clear, ["stalled_at_section"]);
    assert.deepEqual(flagsOnEntering("client").set, { paid_questions_incomplete: false });
  });
});

describe("the tracker's batch", () => {
  const SID = "6f1c2b7e-1d2a-4b3c-9d4e-5f6a7b8c9d0e";
  const VID = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
  const NOW = 1_760_000_000_000;

  it("carries the visitor id, and ignores a malformed one", () => {
    const ok = parseBatch(JSON.stringify({ session_id: SID, visitor_id: VID, events: [] }), NOW)!;
    assert.equal(ok.visitorId, VID);
    const bad = parseBatch(JSON.stringify({ session_id: SID, visitor_id: "nope", events: [] }), NOW)!;
    assert.equal(bad.visitorId, null);
  });

  it("keeps GA's ids in analytics_linked, which the scrub would take for phone numbers", () => {
    const parsed = parseBatch(
      JSON.stringify({
        session_id: SID,
        events: [
          { type: "analytics_linked", at: NOW, payload: { ga_client_id: "1797649617.1725291117", ga_session_id: "1750704979", clarity_pushed: true } },
          { type: "cta_clicked", at: NOW, payload: { note: "9876543210" } },
        ],
      }),
      NOW,
    )!;
    assert.equal(parsed.events[0].payload.ga_session_id, "1750704979");
    assert.equal(parsed.events[0].payload.ga_client_id, "1797649617.1725291117");
    // Anywhere else, a ten-digit run is still scrubbed.
    assert.equal(parsed.events[1].payload.note, "[number]");
  });

  it("accepts the video and founder-block events", () => {
    const types = ["video_impression", "video_play_click", "video_started", "video_progress", "video_completed", "video_paused", "video_abandoned", "story_cta_clicked", "story_watch_clicked"];
    const parsed = parseBatch(JSON.stringify({ session_id: SID, events: types.map((type) => ({ type, at: NOW, payload: { placement: "t1_landing_story" } })) }), NOW)!;
    assert.deepEqual(parsed.events.map((e) => e.type), types);
  });

  it("never accepts the identity events from a browser", () => {
    const types = ["visitor_created", "identity_resolved", "identity_merged", "state_changed"];
    const parsed = parseBatch(JSON.stringify({ session_id: SID, events: types.map((type) => ({ type, at: NOW })) }), NOW)!;
    assert.equal(parsed.events.length, 0);
  });
});

describe("Clarity's funnel tags (Instrumentation §1.2)", () => {
  it("places each page in the funnel", () => {
    assert.deepEqual(funnelPosition("/"), { tier: "1", stage: "landing" });
    assert.deepEqual(funnelPosition("/audit"), { tier: "1", stage: "questionnaire" });
    assert.deepEqual(funnelPosition("/audit/report/abc"), { tier: "1", stage: "result" });
    assert.deepEqual(funnelPosition("/report/checkout"), { tier: "2", stage: "checkout" });
    assert.deepEqual(funnelPosition("/report/my/abc/questions"), { tier: "2", stage: "questionnaire" });
    assert.equal(funnelPosition("/privacy"), null);
    assert.equal(funnelPosition("/manage"), null);
  });
});
