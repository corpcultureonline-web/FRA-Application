import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { inspect } from "node:util";
import type { Browser } from "puppeteer-core";

/**
 * Where Chromium is unpacked. @sparticuz/chromium defaults to /tmp, but
 * Hostinger mounts /tmp noexec (spawn fails with EACCES), so unpack under the
 * home directory instead. Kept outside the deploy folder so it survives
 * redeploys; the name carries the Chromium major version (pinned in
 * package.json) so an upgrade unpacks fresh.
 */
export const CHROMIUM_DIR =
  process.env.CHROMIUM_DIR ?? join(homedir(), ".cache", "fra-chromium-153");

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
 * @sparticuz/chromium unpacks into os.tmpdir(), which reads TMPDIR on every
 * call, so point it at CHROMIUM_DIR for the duration of the unpack.
 */
async function inChromiumDir<T>(task: () => Promise<T>): Promise<T> {
  const previous = process.env.TMPDIR;
  process.env.TMPDIR = CHROMIUM_DIR;
  try {
    return await task();
  } finally {
    if (previous === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = previous;
  }
}

async function loadModules() {
  guardStdin();
  const [{ default: chromium, inflate }, { default: puppeteer }] = await Promise.all([
    import("@sparticuz/chromium"),
    import("puppeteer-core"),
  ]);
  chromium.setGraphicsMode = false;
  return { chromium, inflate, puppeteer };
}

type Modules = Awaited<ReturnType<typeof loadModules>>;

// Memoised so concurrent requests never unpack into the same folder at once.
let executablePromise: Promise<string> | undefined;
let bundledLibsPromise: Promise<string> | undefined;

function unpackChromium({ chromium }: Modules) {
  executablePromise ??= inChromiumDir(async () => {
    await mkdir(CHROMIUM_DIR, { recursive: true });
    return chromium.executablePath();
  }).catch((error) => {
    executablePromise = undefined;
    throw error;
  });
  return executablePromise;
}

/**
 * The package's bundled shared libraries (built for Amazon Linux 2023). Only
 * unpacked if Chromium can't find a system library, since they may clash
 * with the host's own glibc when not needed.
 */
function unpackBundledLibs({ inflate }: Modules) {
  bundledLibsPromise ??= inChromiumDir(async () => {
    // The package doesn't export its bin path; the server runs from the app root.
    const binDir = join(process.cwd(), "node_modules", "@sparticuz", "chromium", "bin");
    return join(await inflate(join(binDir, "al2023.tar.br")), "lib");
  }).catch((error) => {
    bundledLibsPromise = undefined;
    throw error;
  });
  return bundledLibsPromise;
}

/**
 * Launches headless Chromium from @sparticuz/chromium, which ships its own
 * Chromium build, so no system Chrome or root access is needed. Callers must
 * close the browser.
 *
 * Talks to Chromium over pipes, not a localhost WebSocket: on Hostinger the
 * DevTools port refused connections (ECONNREFUSED). `dumpio` forwards
 * Chromium's own stdout/stderr to the app log, for diagnosing crashes.
 */
export async function launchBrowser(
  onStage?: (stage: string) => void,
  { dumpio = false }: { dumpio?: boolean } = {},
): Promise<Browser> {
  onStage?.("load modules");
  const modules = await loadModules();
  const { chromium, puppeteer } = modules;
  onStage?.("unpack chromium");
  const executablePath = await unpackChromium(modules);
  const args = await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" });

  const launch = (libDir?: string) =>
    puppeteer.launch({
      args,
      executablePath,
      headless: "shell",
      pipe: true,
      dumpio,
      env: {
        ...process.env,
        FONTCONFIG_PATH: join(CHROMIUM_DIR, "fonts"),
        ...(libDir && {
          LD_LIBRARY_PATH: [libDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":"),
        }),
      },
    });

  try {
    onStage?.("start chromium");
    return await launch();
  } catch (error) {
    if (!inspect(error).includes("error while loading shared libraries")) throw error;
    onStage?.("unpack bundled libraries");
    const libDir = await unpackBundledLibs(modules);
    onStage?.("start chromium with bundled libraries");
    return launch(libDir);
  }
}
