import { Readable } from "node:stream";
import type { Browser } from "puppeteer-core";

/**
 * Hostinger runs the app without a usable stdin, so merely reading
 * `process.stdin` throws `open EEXIST`. puppeteer-core pulls in
 * @puppeteer/browsers, whose CLI does `import { stdin } from "node:process"`,
 * and that import reads the getter — crashing the route at load time.
 * Swap in an empty stream (only when the real one is broken) before
 * puppeteer-core is imported; nothing here ever reads stdin.
 */
function guardStdin() {
  try {
    void process.stdin;
  } catch {
    Object.defineProperty(process, "stdin", {
      value: Readable.from([]),
      configurable: true,
      writable: true,
    });
  }
}

/**
 * Launches headless Chromium from @sparticuz/chromium, which bundles its own
 * Linux libraries, so it runs without root or a system Chrome. Imports are
 * dynamic so guardStdin() runs first. Callers must close the browser.
 */
export async function launchBrowser(): Promise<Browser> {
  guardStdin();
  const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
    import("@sparticuz/chromium"),
    import("puppeteer-core"),
  ]);

  chromium.setGraphicsMode = false;
  return puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });
}
