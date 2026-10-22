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
import { parseLandingProse } from "./landing-prose.ts";
import { AUDIT_EMAIL_ERROR } from "./live-strings.ts";

const CONTENT = path.join(process.cwd(), "src", "content", "tier2");

/** Line endings normalised: Git on Windows may check the copies out as CRLF. */
const read = (file: string) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");
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

  // A library may move ahead of the boards (Report v1.8 against keys.json's v1.4, 21 October,
  // while hand-off v2.6 is awaited); a copy older than the boards is the error.
  it("no copied library is older than the version keys.json was checked against", () => {
    const parts = (version: string) => version.replace(/^v/, "").split(".").map(Number);
    const older = (a: string, b: string) => {
      const [x, y] = [parts(a), parts(b)];
      for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) < (y[i] ?? 0);
      return false;
    };
    for (const file of libraryFiles()) {
      const header = /\*\*Version ([0-9.]+)/.exec(read(path.join(CONTENT, file)))?.[1];
      const expected = Object.values(index.keys).find((entry) => entry.library === file)?.version;
      // Files the boards take no keys from (the question source) carry no board version.
      if (!expected) continue;
      assert.ok(header && !older(header, expected), `${file} v${header} is older than the boards' ${expected}`);
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

  it("takes the column headed Copy, not a Status column after it", () => {
    const carried = keys("Content-Library-Tier2-Carried.md");
    assert.equal(carried.get("T2W-FIX"), "Something not right? Tell us and we will correct it before Ronak reviews your Report.");
    assert.equal(carried.get("T2W-START"), "**Start the questions**");
  });

  it("every Screen 3 key on the boards has a string", () => {
    for (const [key, entry] of Object.entries(index.keys)) {
      if (key.startsWith("T2W-")) assert.ok(keys(entry.library).has(key), key);
    }
  });

  it("every Screen 5 key on the boards has a string", () => {
    for (const [key, entry] of Object.entries(index.keys)) {
      if (key.startsWith("T2S-")) assert.ok(keys(entry.library).has(key), key);
    }
  });

  it("every Screen 7 key on the boards, and every resume-email key, has a string", () => {
    for (const [key, entry] of Object.entries(index.keys)) {
      if (key.startsWith("T2RS-")) assert.ok(keys(entry.library).has(key), key);
    }
    const messages = keys("Content-Library-Tier2-Messages.md");
    for (const kind of ["RESUME", "RELINK"]) {
      for (const part of ["SUBJ", "HEAD", "BODY", "BTN"]) assert.ok(messages.has(`T2M-${kind}-${part}`), `T2M-${kind}-${part}`);
    }
    assert.ok(messages.has("T2M-RESUME-PRIVATE"));
  });

  it("the Screen 5 email error is the live Audit's sentence (Submitted §3: the live wording wins)", () => {
    const audit = read(path.join(process.cwd(), "src", "app", "audit", "ProfileForm.tsx"));
    assert.ok(audit.includes(`"${AUDIT_EMAIL_ERROR}"`), "the Audit's email error changed; update live-strings.ts");
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

describe("Tier 2 libraries: the review panel and its emails", () => {
  const admin = keys("Content-Library-Tier2-Admin.md");
  const messages = keys("Content-Library-Tier2-Messages.md");

  it("every T2A key the panel renders has a string", () => {
    const used = [
      "LOGIN-HEAD", "LOGIN-SUB", "LOGIN-LABEL", "LOGIN-BTN", "LOGIN-SENT-HEAD", "LOGIN-SENT-SUB", "LOGIN-EXPIRED-HEAD",
      "LOGIN-EXPIRED-SUB", "LOGIN-EXPIRED-BTN", "SIGNEDOUT-HEAD", "SIGNEDOUT-BTN", "SIGNOUT", "NAV-QUEUE", "NAV-RATES", "NAV-BACK",
      "ELAPSED", "ELAPSED-WARN", "ELAPSED-BREACH", "DELIVERED-IN", "ST-WAITING", "ST-APPROVED", "ST-RETURNED", "ST-REFUNDED",
      "EMPTY", "EMPTY-SUB", "FLAG-DK", "FLAG-DK-LEAD", "FLAG-NOTASSESSED", "FLAG-CONTRA", "FLAG-MARGIN", "EDIT", "EDIT-SAVE",
      "EDIT-CANCEL", "EDITED", "EDIT-ORIG", "EDIT-REVERT", "CANCEL", "APPROVE", "APPROVE-CONFIRM", "RETURN", "RETURN-LABEL",
      "RETURN-SAVE", "REFUND", "REFUND-CONFIRM", "REFUND-DO", "RATE-HEAD", "RATE-SUB", "RATE-FLAG", "RATE-EMPTY",
    ];
    for (const key of used) assert.ok(admin.get(`T2A-${key}`), `T2A-${key}`);
    assert.equal(admin.get("T2A-ELAPSED"), "{n}h");
    assert.equal(admin.get("T2A-FLAG-MARGIN"), "Company margin matches the Audit's outlet margin — the founder may not have distinguished them");
  });

  it("the sign-in, Report-ready and refund emails have every part", () => {
    for (const key of ["SIGNIN-SUBJ", "SIGNIN-HEAD", "SIGNIN-BTN", "SIGNIN-EXPIRY", "SIGNIN-IGNORE", "READY-SUBJ", "READY-HEAD", "READY-BODY",
      "READY-BTN", "READY-PRIVATE", "READY-HELP", "REFUND-SUBJ", "REFUND-HEAD", "REFUND-BODY", "REFUND-ENTITY", "REFUND-NOTHING", "REFUND-HELP"]) {
      assert.ok(messages.get(`T2M-${key}`), `T2M-${key}`);
    }
    assert.equal(messages.get("T2M-SIGNIN-EXPIRY"), "This link works once and expires in 15 minutes.");
  });
});

describe("Tier 2 libraries: Screen 1's prose strings", () => {
  const prose = parseLandingProse(read(path.join(CONTENT, "Content-Library-Tier2-Landing.md")));

  it("the fixed known-visitor opening and the boundary heading, as the library quotes them", () => {
    assert.equal(prose.knownHead, "You scored between {low} and {high}.");
    assert.equal(prose.knownSub, "The Report replaces that range with one number, and tells you what is behind it.");
    assert.equal(prose.knownCta, "Get my full report");
    assert.equal(prose.boundaryHead, "This diagnoses. It does not prescribe. That is the Roadmap.");
  });

  it("all four FAQ entries, each with its question and its whole answer", () => {
    assert.deepEqual(prose.faq.map((f) => f.key), ["T2L-FAQ-RESUME", "T2L-FAQ-ACCOUNTANT", "T2L-FAQ-DATA", "T2L-FAQ-NOT-READY"]);
    assert.equal(prose.faq[0].question, "Can I finish it later?");
    assert.match(prose.faq[1].answer, /^That is common\. \*\*Your Report link is private/);
    assert.match(prose.faq[3].answer, /a year spent on the wrong thing\.$/);
  });
});
