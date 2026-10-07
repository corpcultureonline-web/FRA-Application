import os from "node:os";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { NextResponse } from "next/server";

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
    freeMemMb: Math.round(os.freemem() / 1024 / 1024),
  };

  let step = "resolve executable";
  let browser;
  try {
    chromium.setGraphicsMode = false;
    const executablePath = await chromium.executablePath();

    step = "launch browser";
    browser = await puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath,
      headless: "shell",
    });

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
      { ok: false, step, error: error instanceof Error ? error.message : String(error), env },
      { status: 500 },
    );
  } finally {
    await browser?.close().catch(() => {});
  }
}
