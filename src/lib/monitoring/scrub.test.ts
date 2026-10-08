/**
 * No personal data or secrets in an error event (Response to the Tech Stack
 * Audit §1.3): checked deliberately, since HTTP client errors routinely carry
 * request headers and connection strings.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scrubEvent, scrubText } from "./scrub.ts";

const env = {
  DATABASE_URL: "mysql://fra:s3cretPass@localhost:3306/fra_prod",
  ZOHO_REFRESH_TOKEN: "1000.abcdef123456.zyxw",
  ZOHO_CLIENT_SECRET: "client-secret-value",
};

describe("scrubbing error events", () => {
  it("removes emails, mobiles, report tokens and credentials from text", () => {
    const text =
      "Failed for anita@stringsacademy.in +91 80728 30857 /api/report/61e9ce8c2f88aa9a9ce0a0e67e038d3f mysql://fra:pw@db/x";
    const out = scrubText(text);
    assert.ok(!out.includes("anita@"), out);
    assert.ok(!out.includes("30857"), out);
    assert.ok(!out.includes("61e9ce8c"), out);
    assert.ok(!out.includes(":pw@"), out);
  });

  it("removes configured secret values wherever they appear", () => {
    const event = { exception: { values: [{ value: `token refresh failed: ${env.ZOHO_REFRESH_TOKEN}` }] } };
    const out = JSON.stringify(scrubEvent(event, env));
    assert.ok(!out.includes(env.ZOHO_REFRESH_TOKEN), out);
  });

  it("drops request headers, bodies, cookies, the user and questionnaire fields", () => {
    const event = {
      user: { email: "a@b.co", ip_address: "1.2.3.4" },
      request: {
        url: "https://corpculture.co/franchise-audit/api/audit",
        headers: { authorization: "Zoho-oauthtoken 1000.x" },
        cookies: { a: "b" },
        data: { profile: { brandName: "Strings", email: "a@b.co" }, answers: { UE01: "x" } },
      },
      extra: { brandName: "Strings", founderName: "Anita" },
      tags: { submission_id: "42" },
    };
    const out = scrubEvent(event, env) as Record<string, unknown>;
    const json = JSON.stringify(out);
    for (const leaked of ["Strings", "Anita", "a@b.co", "1.2.3.4", "oauthtoken", "UE01"]) {
      assert.ok(!json.includes(leaked), `${leaked} in ${json}`);
    }
    assert.match(json, /"submission_id":"42"/);
    assert.match(json, /franchise-audit\/api\/audit/);
  });

  it("keeps Sentry's own ids, the release SHA and timestamps", () => {
    const event = {
      event_id: "0123456789abcdef0123456789abcdef",
      release: "5b84e38a1f2c3d4e5f60718293a4b5c6d7e8f901",
      contexts: { trace: { trace_id: "fedcba9876543210fedcba9876543210" } },
      message: "at 2026-10-08 14:05:12",
    };
    assert.deepEqual(scrubEvent(event, env), event);
  });
});
