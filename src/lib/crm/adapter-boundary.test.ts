/**
 * INV-7 (decision T10): Zoho is reached through the adapter only. Fails if any
 * source file outside src/lib/crm/ calls Zoho directly — its API hosts, a
 * `zoho.*` call, or a Zoho env var other than through the adapter.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, it } from "node:test";

const SRC = join(import.meta.dirname, "..", "..");
const ADAPTER_DIR = join(SRC, "lib", "crm") + sep;
const DIRECT_ZOHO = /zohoapis\.|accounts\.zoho|zoho\.\w+\(|process\.env\.ZOHO_/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|mjs|js)$/.test(name) ? [path] : [];
  });
}

describe("the CRM adapter boundary (INV-7)", () => {
  it("no file outside src/lib/crm/ calls Zoho directly", () => {
    const offenders = sourceFiles(SRC)
      .filter((path) => !path.startsWith(ADAPTER_DIR))
      .filter((path) => DIRECT_ZOHO.test(readFileSync(path, "utf8")))
      .map((path) => relative(SRC, path));
    assert.deepEqual(offenders, [], `Direct Zoho access outside the adapter: ${offenders.join(", ")}`);
  });
});
