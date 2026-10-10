/**
 * The landing page's structured data must match what the page shows: the same
 * FAQ, the prices from pricing.ts, and Ronak's figures as the page prints them.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FOUNDER_STATS } from "../../lib/company.ts";
import { FAQ, faqPlainText } from "./faq.ts";
import { jsonLd, landingStructuredData } from "./structured-data.ts";

const graph = landingStructuredData()["@graph"] as Record<string, unknown>[];
const byType = (type: string) => graph.find((node) => node["@type"] === type)!;

describe("landing structured data", () => {
  it("publishes every FAQ question with its visible answer, without markup", () => {
    const entities = byType("FAQPage").mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    assert.deepEqual(entities.map((e) => e.name), FAQ.map((f) => f.question));
    for (const [i, faq] of FAQ.entries()) {
      assert.equal(entities[i].acceptedAnswer.text, faqPlainText(faq));
      assert.ok(!entities[i].acceptedAnswer.text.includes("**"), faq.question);
    }
  });

  it("prices the offers from pricing.ts, exclusive of GST", () => {
    const offers = byType("Service").offers as { name: string; price: string; priceSpecification?: { valueAddedTaxIncluded: boolean } }[];
    assert.deepEqual(offers.map((o) => [o.name, o.price]), [
      ["Franchise Readiness Audit", "0"],
      ["Franchise Readiness Report", "1999"],
      ["Franchise Readiness Roadmap", "5999"],
    ]);
    assert.equal(offers[1].priceSpecification!.valueAddedTaxIncluded, false);
  });

  it("names Blue Bird Ventures as the parent", () => {
    assert.equal((byType("Organization").parentOrganization as { name: string }).name, "Blue Bird Ventures");
  });

  it("states Ronak's figures exactly as the page does, and no title until O6 is settled", () => {
    const person = byType("Person") as { description: string; jobTitle?: string };
    for (const stat of FOUNDER_STATS) assert.ok(person.description.includes(stat.value), stat.value);
    assert.equal(person.jobTitle, undefined);
  });

  it("cannot close its own <script> tag", () => {
    assert.ok(!jsonLd({ text: "</script><script>alert(1)</script>" }).includes("</script>"));
  });
});
