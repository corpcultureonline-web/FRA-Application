/**
 * Prices as fixed in CANONICAL-VALUES §1: base exclusive of GST, payable
 * computed and rounded to the nearest rupee.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { payable, payableLabel, priceLabel, shortPriceLabel } from "./pricing.ts";

describe("pricing (CANONICAL-VALUES §1)", () => {
  it("Report: ₹1,999 + 18% GST, ₹2,359 payable", () => {
    assert.equal(priceLabel("report"), "₹1,999 + 18% GST");
    assert.equal(shortPriceLabel("report"), "₹1,999 + GST");
    assert.equal(payable("report"), 2359);
    assert.equal(payableLabel("report"), "₹2,359");
  });

  it("Roadmap: ₹5,999 + 18% GST, ₹7,079 payable", () => {
    assert.equal(priceLabel("roadmap"), "₹5,999 + 18% GST");
    assert.equal(payable("roadmap"), 7079);
  });
});
