import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseLibraryKeys } from "./library";

/**
 * The Tier 2 content libraries, copied verbatim into src/content/tier2 from
 * the project's library folder, with `keys.json` from the design handoff as
 * the index of which library owns which key. Read at build time; the pages
 * that use them are static.
 */
const CONTENT = path.join(process.cwd(), "src", "content", "tier2");

type KeyIndex = { keys: Record<string, { library: string; version: string }> };

let cache: Map<string, string> | undefined;

/**
 * keys.json lists the keys that appear on a board, with their owner. A few
 * keys never reach a board as text — the price lines render from config — so
 * any key it does not list is taken from the copied library that defines it.
 */
function load() {
  if (cache) return cache;
  const index = JSON.parse(readFileSync(path.join(CONTENT, "keys.json"), "utf8")) as KeyIndex;
  const libraries = new Map(
    readdirSync(CONTENT)
      .filter((file) => file.endsWith(".md"))
      .map((file) => [file, parseLibraryKeys(readFileSync(path.join(CONTENT, file), "utf8"))] as const),
  );
  const strings = new Map<string, string>();
  for (const [key, { library }] of Object.entries(index.keys)) {
    const copy = libraries.get(library)?.get(key);
    if (copy !== undefined) strings.set(key, copy);
  }
  for (const [library, keys] of libraries) {
    for (const [key, copy] of keys) {
      if (!index.keys[key] && !strings.has(key)) strings.set(key, copy);
      else if (!index.keys[key] && strings.get(key) !== copy) {
        throw new Error(`${key} differs between libraries (${library}); keys.json must name its owner`);
      }
    }
  }
  cache = strings;
  return strings;
}

/**
 * The library string for a key, with its **bold** markup intact. Throws for a
 * key nobody has written: a missing string is raised, never invented.
 */
export function t2(key: string): string {
  const copy = load().get(key);
  if (copy === undefined) throw new Error(`No library string for ${key}`);
  return copy;
}
