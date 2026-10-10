/**
 * zoho_push (Decision T13, Response to the Tech Stack Audit §1.5): every Zoho
 * attempt is reported — failures and retries too, not only successes — with
 * ids and codes only. Zoho is simulated; nothing leaves the machine.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createFraSubmission, updateFraSubmission, type CrmCall } from "./adapter.ts";

const realFetch = globalThis.fetch;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let crmResponses: Response[] = [];
let tokenOk = true;

beforeEach(() => {
  process.env.ZOHO_CLIENT_ID = "id";
  process.env.ZOHO_CLIENT_SECRET = "secret";
  process.env.ZOHO_REFRESH_TOKEN = "refresh";
  tokenOk = true;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/oauth/v2/token")) {
      return tokenOk ? json(200, { access_token: `t${Math.random()}`, expires_in: 3600 }) : json(400, { error: "invalid_code" });
    }
    const next = crmResponses.shift();
    if (!next) throw new Error(`Unexpected request: ${url}`);
    return next;
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  crmResponses = [];
});

const submission = { brandName: "Strings", founderName: "Anita", email: "anita@strings.in" };

describe("zoho_push reporting", () => {
  it("reports a 401 attempt and the successful retry", async () => {
    crmResponses = [
      json(401, { code: "INVALID_TOKEN" }),
      json(201, { data: [{ code: "SUCCESS", status: "success", details: { id: "4876001" } }] }),
    ];
    const calls: CrmCall[] = [];
    const result = await createFraSubmission(submission, (call) => calls.push(call));

    assert.equal(result.id, "4876001");
    assert.deepEqual(
      calls.map((c) => [c.attempt, c.http_status, c.ok, c.error_code, c.zoho_record_id]),
      [
        [1, 401, false, "INVALID_TOKEN", null],
        [2, 201, true, null, "4876001"],
      ],
    );
    assert.ok(calls.every((c) => c.module === "FRA Submissions" && c.operation === "create" && c.ms >= 0));
    const json_ = JSON.stringify(calls);
    for (const leaked of ["Strings", "Anita", "anita@"]) assert.ok(!json_.includes(leaked), leaked);
  });

  it("reports a rejected record with Zoho's code, then throws", async () => {
    crmResponses = [json(400, { data: [{ code: "INVALID_DATA", status: "error", message: "bad" }] })];
    const calls: CrmCall[] = [];
    await assert.rejects(updateFraSubmission("4876001", { Phone: "x" }, (call) => calls.push(call)));
    assert.deepEqual(
      calls.map((c) => [c.operation, c.attempt, c.http_status, c.ok, c.error_code]),
      [["update", 1, 400, false, "INVALID_DATA"]],
    );
  });

  it("reports a failed token refresh", async () => {
    tokenOk = false;
    const calls: CrmCall[] = [];
    // A cached token from an earlier test may still be valid; force the 401 path.
    crmResponses = [json(401, { code: "INVALID_TOKEN" })];
    await assert.rejects(updateFraSubmission("4876001", { Phone: "x" }, (call) => calls.push(call)));
    assert.equal(calls.at(-1)!.error_code, "TOKEN_REFRESH_FAILED");
    assert.equal(calls.at(-1)!.http_status, null);
    assert.equal(calls.at(-1)!.ok, false);
  });
});
