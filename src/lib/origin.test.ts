/**
 * SITE_URL as typed into a hosting panel. A missing https:// made Chromium
 * refuse the PDF page ("Cannot navigate to invalid URL") on app.corpculture.co.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normaliseOrigin } from "./origin.ts";

describe("normaliseOrigin", () => {
  it("accepts the common ways of writing the site address", () => {
    for (const raw of [
      "https://app.corpculture.co",
      "https://app.corpculture.co/",
      "app.corpculture.co",
      "  app.corpculture.co  ",
      '"https://app.corpculture.co"',
      "https://app.corpculture.co/franchise-audit",
      "https://app.corpculture.co/franchise-audit/",
    ]) {
      assert.equal(normaliseOrigin(raw), "https://app.corpculture.co", raw);
    }
  });

  it("keeps an explicit http:// and a port", () => {
    assert.equal(normaliseOrigin("http://localhost:3000"), "http://localhost:3000");
  });

  it("returns null for empty or unusable values, so the request's host is used", () => {
    for (const raw of [undefined, null, "", "   ", '""', "ftp://example.com", "https://"]) {
      assert.equal(normaliseOrigin(raw), null, String(raw));
    }
  });
});
