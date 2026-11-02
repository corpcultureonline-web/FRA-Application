/**
 * Section 1's WhatsApp number (handoff v3.1 §5.1): mandatory, format only —
 * ten digits starting 6–9 — and stored as those ten digits.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMPTY_PROFILE, isValidEmail, normaliseMobile, profileProblems, readProfile } from "./audit.ts";

const filled = {
  ...EMPTY_PROFILE,
  brandName: "Test Brand",
  founderName: "Founder",
  email: "founder@example.com",
  phone: "98765 43210",
  category: "Retail",
  outlets: "2–5",
  city: "Chennai",
};

describe("the email address on Section 1", () => {
  it("takes one @ with a dotted domain, and refuses a doubled @ (staging test, 2 Nov, V3)", () => {
    for (const typed of ["founder@brand.in", " a.b+c@mail.co.uk "]) assert.equal(isValidEmail(typed), true, typed);
    for (const typed of ["two@@at.com", "a@b@c.com", "a@b", "nospace @x.com", "@x.com", ""]) assert.equal(isValidEmail(typed), false, typed);
  });
});

describe("the WhatsApp number on Section 1", () => {
  it("accepts ten digits starting 6–9, with spaces, dashes, +91 or 0", () => {
    for (const typed of ["9876543210", "98765 43210", "98765-43210", "+91 98765 43210", "+919876543210", "919876543210", "09876543210"]) {
      assert.equal(normaliseMobile(typed), "9876543210", typed);
    }
  });

  it("refuses anything else", () => {
    for (const typed of ["", "5876543210", "987654321", "98765432101", "+1 9876543210", "98765 4321O"]) {
      assert.equal(normaliseMobile(typed), null, typed);
    }
  });

  it("is mandatory: a profile without it has a problem, and only that one", () => {
    assert.deepEqual(profileProblems({ ...filled, phone: "" }), ["phone"]);
    assert.deepEqual(profileProblems(filled), []);
  });

  it("reaches the server as ten digits, and a profile without it is refused", () => {
    assert.equal(readProfile(filled)?.phone, "9876543210");
    assert.equal(readProfile({ ...filled, phone: "12345" }), null);
    assert.equal(readProfile({ ...filled, phone: undefined }), null);
  });
});
