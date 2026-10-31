/**
 * The legal pages (HANDOFF.md §13): the published text is the source library's,
 * unchanged, and the template reads every construct those files use.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { LIBRARY_DIR as LIBRARY } from "../tier2/library-source.ts";
import { parseInline, parseLegalMarkdown, type Block } from "./markdown.ts";

const CONTENT = path.join(process.cwd(), "src", "content", "legal");

const DOCUMENTS = [
  { slug: "privacy", source: "Privacy-Policy.md", stripQuote: false },
  { slug: "terms", source: "Terms-and-Conditions.md", stripQuote: false },
  { slug: "refunds", source: "Refund-Policy.md", stripQuote: true },
] as const;

const read = (file: string) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const parse = (slug: string) => parseLegalMarkdown(read(path.join(CONTENT, `${slug}.md`)));
const sections = (blocks: Block[]) => blocks.filter((block) => block.t === "section");

describe("legal pages: text matches the content library", () => {
  for (const doc of DOCUMENTS) {
    const sourceFile = path.join(LIBRARY, doc.source);
    it(`${doc.slug}.md is a verbatim excerpt of ${doc.source}`, { skip: !existsSync(sourceFile) }, () => {
      const source = new Set(
        read(sourceFile)
          .split("\n")
          .map((line) => (doc.stripQuote ? line.replace(/^> ?/, "") : line)),
      );
      const copied = read(path.join(CONTENT, `${doc.slug}.md`))
        .split("\n")
        .filter((line) => line.trim() !== "" && !line.startsWith("<!--"));
      const missing = copied.filter((line) => !source.has(line));
      assert.deepEqual(missing, [], "lines not found in the source; re-copy the published text");
    });
  }
});

describe("legal pages: what is and is not published", () => {
  it("Privacy has sections 1–13 and not §14 Record", () => {
    const numbers = sections(parse("privacy")).map((block) => block.t === "section" && block.n);
    assert.deepEqual(numbers, Array.from({ length: 13 }, (_, i) => String(i + 1)));
  });

  it("Terms has sections 1–16 and not §17 Record", () => {
    const numbers = sections(parse("terms")).map((block) => block.t === "section" && block.n);
    assert.deepEqual(numbers, Array.from({ length: 16 }, (_, i) => String(i + 1)));
  });

  it("Refund Policy is §A only, with unnumbered headings", () => {
    const blocks = parse("refunds");
    assert.deepEqual(blocks[0], { t: "title", text: "Refund Policy" });
    const heads = sections(blocks);
    assert.ok(heads.length > 5);
    assert.ok(heads.every((block) => block.t === "section" && block.n === null));
    assert.ok(!read(path.join(CONTENT, "refunds.md")).includes("How this gets used"));
  });

  it("every page carries one date, near the top, waiting for the deploy constant", () => {
    for (const doc of DOCUMENTS) {
      const blocks = parse(doc.slug);
      const updated = blocks.filter((block) => block.t === "updated");
      assert.equal(updated.length, 1, doc.slug);
      assert.ok(blocks.indexOf(updated[0]) <= 2, `${doc.slug}: date is not at the top`);
    }
  });

  it("the entity block is a key–value list; the other tables keep their headers", () => {
    const blocks = parse("terms");
    const kv = blocks.find((block) => block.t === "kv");
    assert.ok(kv && kv.t === "kv" && kv.rows.length === 4);
    const table = blocks.find((block) => block.t === "table");
    assert.ok(table && table.t === "table" && table.head.length === 3 && table.rows.length === 3);
  });

  it("no unparsed Markdown reaches the page", () => {
    const leftovers = (nodes: ReturnType<typeof parseInline>): string[] =>
      nodes.flatMap((node) => (node.t === "text" ? [node.v] : node.t === "code" ? [] : leftovers(node.c)));
    for (const doc of DOCUMENTS) {
      for (const block of parse(doc.slug)) {
        const inline =
          block.t === "p"
            ? block.lines.flat()
            : block.t === "list"
              ? block.items.flat()
              : block.t === "table"
                ? [...block.head, ...block.rows.flat()].flat()
                : block.t === "kv"
                  ? block.rows.flatMap((row) => [...row.label, ...row.value])
                  : [];
        for (const text of leftovers(inline)) {
          assert.doesNotMatch(text, /\*|`|\]\(|^#|^\|/, `${doc.slug}: ${text}`);
        }
      }
    }
  });
});

describe("legal markdown: inline", () => {
  it("bold, italic, links and code spans", () => {
    assert.deepEqual(parseInline("See the [Refund Policy](/franchise-audit/refunds)."), [
      { t: "text", v: "See the " },
      { t: "a", href: "/franchise-audit/refunds", c: [{ t: "text", v: "Refund Policy" }] },
      { t: "text", v: "." },
    ]);
    assert.deepEqual(parseInline("**A** and *b* at `c`"), [
      { t: "b", c: [{ t: "text", v: "A" }] },
      { t: "text", v: " and " },
      { t: "i", c: [{ t: "text", v: "b" }] },
      { t: "text", v: " at " },
      { t: "code", v: "c" },
    ]);
  });
});
