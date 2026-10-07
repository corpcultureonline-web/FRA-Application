import { readdir, stat } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";
import { inspect } from "node:util";
import type { Browser } from "puppeteer-core";
import { NextResponse } from "next/server";
import { CHROMIUM_DIR, launchBrowser } from "@/lib/browser";

/**
 * TEMPORARY: checks whether headless Chromium can run on the host (Hostinger)
 * before the results PDF is built on Puppeteer. Open /api/pdf-test: success
 * returns a one-page PDF; failure returns JSON naming the step that broke.
 * Delete this route once the check is done.
 */
export const dynamic = "force-dynamic";

const html = `<!doctype html>
<html><body style="font-family: sans-serif; padding: 40px">
  <h1 style="color: #1d4ed8">PDF test OK</h1>
  <p>Generated at {{time}} by headless Chromium.</p>
</body></html>`;

export async function GET() {
  const env = {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    tmpdir: os.tmpdir(),
    chromiumDir: CHROMIUM_DIR,
    freeMemMb: Math.round(os.freemem() / 1024 / 1024),
  };

  let step = "launch browser";
  let browser: Browser | undefined;
  try {
    browser = await launchBrowser((stage) => (step = `launch browser: ${stage}`));

    step = "render page";
    const page = await browser.newPage();
    await page.setContent(html.replace("{{time}}", new Date().toISOString()));

    step = "print pdf";
    const pdf = await page.pdf({ format: "A4", printBackground: true });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="pdf-test.pdf"',
      },
    });
  } catch (error) {
    console.error(`PDF test failed at "${step}"`, error);
    return NextResponse.json(
      {
        ok: false,
        step,
        error: inspect(error, { depth: 4, breakLength: Infinity }),
        env,
        chromiumFiles: await listChromiumDir(),
      },
      { status: 500 },
    );
  } finally {
    await browser?.close().catch(() => {});
  }
}

/** Name, size and permissions of each entry in the unpack folder. */
async function listChromiumDir() {
  try {
    const names = await readdir(CHROMIUM_DIR);
    return await Promise.all(
      names.map(async (name) => {
        const info = await stat(join(CHROMIUM_DIR, name));
        return `${name} ${info.isDirectory() ? "dir" : `${info.size}B`} mode=${(info.mode & 0o777).toString(8)}`;
      }),
    );
  } catch (error) {
    return `unreadable: ${inspect(error)}`;
  }
}
