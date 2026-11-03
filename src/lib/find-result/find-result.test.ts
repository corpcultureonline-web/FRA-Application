/**
 * /find-my-result (handoff v3.1 §6, Find-Result library v1.0): the one field,
 * and the four emails' envelope — WHYTHIS on every one, the second action only
 * on the audit email, and nothing but library text.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseContact } from "./contact.ts";
import { longDate, recoveryEmail, type Stage } from "./email.ts";
import { T1F } from "./strings.ts";

describe("find-my-result: the field", () => {
  it("takes an email, compared lower-cased", () => {
    assert.deepEqual(parseContact("  Founder@Example.COM "), { kind: "email", value: "founder@example.com" });
  });

  it("takes a mobile as the ten digits the Audit stores", () => {
    for (const typed of ["98765 43210", "+91 98765 43210", "09876543210"]) {
      assert.deepEqual(parseContact(typed), { kind: "mobile", value: "9876543210" }, typed);
    }
  });

  it("refuses anything else (T1F-ERR-FORMAT)", () => {
    for (const typed of ["", "founder@", "12345", "5876543210", "chai junction"]) {
      assert.equal(parseContact(typed), null, typed);
    }
  });
});

describe("find-my-result: the four emails", () => {
  const recovery = (stage: Stage) =>
    recoveryEmail({
      stage,
      to: "founder@example.com",
      founderName: "Anita Rao",
      completedAt: new Date("2026-10-21T06:00:00Z"),
      url: `https://app.example/${stage}`,
      secondUrl: "https://app.example/report?audit=abc",
    });

  it("each has its own subject and action, and every one says why it arrived", () => {
    const subjects = (["audit", "questions", "waiting", "report"] as const).map((stage) => {
      const mail = recovery(stage);
      assert.match(mail.text, /^Hello Anita Rao,/);
      assert.ok(mail.text.includes(T1F["T1F-MAIL-WHYTHIS"]), stage);
      assert.ok(mail.html.includes("someone asked us to send this link"), stage);
      assert.ok(mail.text.includes(`https://app.example/${stage}`), stage);
      assert.ok(mail.text.endsWith("Corporate Culture is a brand of Blue Bird Ventures"), stage);
      return mail.subject;
    });
    assert.deepEqual(subjects, [
      "Your Franchise Readiness Audit result",
      "Your Report — pick up where you left off",
      "Your Report is with Ronak",
      "Your Franchise Readiness Report",
    ]);
  });

  it("only the audit email offers the full Report, and it prints the day the Audit was done", () => {
    assert.ok(recovery("audit").text.includes("Continue to the full Report: https://app.example/report?audit=abc"));
    assert.ok(recovery("audit").text.includes("Here is the result you completed on 21 October 2026."));
    for (const stage of ["questions", "waiting", "report"] as const) {
      assert.ok(!recovery(stage).text.includes("Continue to the full Report"), stage);
    }
  });

  it("a paid Report and a newer free Audit go in one email, the newer first (§8, v1.1)", () => {
    const mail = recoveryEmail({
      stage: "both",
      to: "founder@example.com",
      founderName: "Anita Rao",
      completedAt: new Date("2027-04-02T06:00:00Z"),
      paidAt: new Date("2026-10-21T06:00:00Z"),
      url: "https://app.example/latest-audit",
      secondUrl: "https://app.example/paid-report",
    });
    assert.equal(mail.subject, "Your Franchise Readiness result and Report");
    assert.ok(mail.text.includes("Here is the Audit you completed on 2 April 2027, and the Report you bought on 21 October 2026."));
    const latest = mail.text.indexOf("Open my latest result: https://app.example/latest-audit");
    const report = mail.text.indexOf("Open my Report: https://app.example/paid-report");
    assert.ok(latest > 0 && report > latest);
    assert.ok(mail.text.includes(T1F["T1F-MAIL-WHYTHIS"]));
  });

  it("dates are India time", () => {
    assert.equal(longDate(new Date("2026-10-21T20:00:00Z")), "22 October 2026");
  });
});
