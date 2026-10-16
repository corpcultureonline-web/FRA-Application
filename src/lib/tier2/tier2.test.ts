/**
 * Tier 2 strings: read from the libraries as written, the copies in the repo
 * identical to the project's library folder, and prices in the copy equal to
 * the pricing config Razorpay is charged from (CANONICAL-VALUES §1).
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { payableLabel, priceLabel } from "../pricing.ts";
import { parseLibraryKeys, plain, segments } from "./library.ts";
import { HANDOFF_DIR as HANDOFF, LIBRARY_DIR as LIBRARY } from "./library-source.ts";

const CONTENT = path.join(process.cwd(), "src", "content", "tier2");

const read = (file: string) => readFileSync(file, "utf8");
const libraryFiles = () => readdirSync(CONTENT).filter((file) => file.endsWith(".md"));
const keys = (file: string) => parseLibraryKeys(read(path.join(CONTENT, file)));
const index = JSON.parse(read(path.join(CONTENT, "keys.json"))) as { keys: Record<string, { library: string; version: string }> };

describe("Tier 2 libraries: repo copies match the source", () => {
  for (const file of libraryFiles()) {
    const source = path.join(LIBRARY, file);
    it(`${file} is identical to the library`, { skip: !existsSync(source) }, () => {
      assert.equal(read(path.join(CONTENT, file)), read(source));
    });
  }

  const sourceKeys = path.join(HANDOFF, "content", "keys.json");
  it("keys.json is identical to the handoff's", { skip: !existsSync(sourceKeys) }, () => {
    assert.equal(read(path.join(CONTENT, "keys.json")), read(sourceKeys));
  });

  it("each copied library is at the version keys.json was checked against", () => {
    for (const file of libraryFiles()) {
      const header = /\*\*Version ([0-9.]+)/.exec(read(path.join(CONTENT, file)))?.[1];
      const expected = Object.values(index.keys).find((entry) => entry.library === file)?.version;
      assert.equal(`v${header}`, expected, file);
    }
  });
});

describe("Tier 2 libraries: key tables", () => {
  it("every checkout key on the boards has a string in its owning library", () => {
    for (const [key, entry] of Object.entries(index.keys)) {
      if (!key.startsWith("T2C-") || !libraryFiles().includes(entry.library)) continue;
      assert.ok(keys(entry.library).has(key), key);
    }
  });

  it("drops notes about a string and keeps its markup", () => {
    const checkout = keys("Content-Library-Tier2-Checkout.md");
    assert.equal(checkout.get("T2L-PAY-REFUND"), "Refund policy");
    assert.equal(checkout.get("T2C-CONSENT"), "I have read the **Terms and Conditions**, **Privacy Policy** and **Refund Policy**.");
  });

  it("takes the copy cell when a placeholder or pair column comes first", () => {
    const landing = keys("Content-Library-Tier2-Landing.md");
    assert.equal(landing.get("T2L-RANGE-LABEL"), "Your free Audit range");
  });

  it("segments split bold for link labels", () => {
    assert.deepEqual(segments("I have read the **Terms**."), [
      { text: "I have read the ", strong: false },
      { text: "Terms", strong: true },
      { text: ".", strong: false },
    ]);
  });
});

describe("Tier 2 prices: the copy says what Razorpay charges", () => {
  const checkout = keys("Content-Library-Tier2-Checkout.md");

  it("T2C-PRICE-HEAD is the base price plus GST", () => {
    assert.equal(plain(checkout.get("T2C-PRICE-HEAD")!), priceLabel("report"));
  });

  it("T2C-PRICE-PAY and T2C-PAY-BTN show the payable total", () => {
    assert.equal(plain(checkout.get("T2C-PRICE-PAY")!), `${payableLabel("report")} payable`);
    assert.equal(plain(checkout.get("T2C-PAY-BTN")!), `Pay ${payableLabel("report")}`);
  });
});
