import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { FOUNDER_STATS } from "../../lib/company.ts";
import { STORY_ARTICLE_URL, STORY_PULL_QUOTE, T1L_STORY, splitBody2 } from "./founder-story.ts";

const library = readFileSync(
  path.join(process.cwd(), "src", "content", "tier1", "Content-Library-Tier1-Landing.md"),
  "utf8",
).replace(/\r\n/g, "\n");

/** The copy cell of a key's row, without the library's "**RULED** — " marks or its notes after a second " — **". */
function libraryCopy(key: string) {
  const row = library.split("\n").find((line) => line.startsWith(`| \`${key}\` |`));
  assert.ok(row, `${key} has a row in the landing library`);
  return row
    .split("|")[2]
    .trim()
    .replace(/^\*\*RULED[^*]*\*\* — /, "")
    .replace(/ — \*\*[^*]+\*\*$/, "");
}

describe("founder block (Landing library v1.7 §7)", () => {
  it("is taken from library v1.7", () => {
    assert.match(library, /\*\*Version 1\.7 · 13 November 2026\*\*/);
  });

  for (const [key, copy] of Object.entries(T1L_STORY)) {
    it(`${key} reads as the library writes it`, () => {
      assert.equal(copy, libraryCopy(key));
    });
  }

  it("prints the four stats as T1L-STAT-1 to -4", () => {
    FOUNDER_STATS.forEach((stat, i) => {
      assert.equal(`${stat.value} · ${stat.label}`, libraryCopy(`T1L-STAT-${i + 1}`));
    });
  });

  it("lifts the pull-quote out of T1L-STORY-BODY-2 without changing the string", () => {
    const { lead, quote } = splitBody2();
    assert.equal(quote, STORY_PULL_QUOTE);
    assert.equal(`${lead} ${quote}`, T1L_STORY["T1L-STORY-BODY-2"]);
  });

  it("never points the watch link at YouTube (T188)", () => {
    assert.ok(STORY_ARTICLE_URL === null || !/youtu\.?be/.test(STORY_ARTICLE_URL));
  });
});
