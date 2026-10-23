import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isNoIndex } from "./seo.ts";

describe("SITE_NOINDEX", () => {
  it("is on only when set to true, 1 or yes", () => {
    for (const value of ["true", "TRUE", "1", "yes", " true "]) assert.equal(isNoIndex({ SITE_NOINDEX: value }), true, value);
    for (const value of [undefined, "", "false", "0", "no"]) assert.equal(isNoIndex({ SITE_NOINDEX: value }), false, String(value));
  });
});
