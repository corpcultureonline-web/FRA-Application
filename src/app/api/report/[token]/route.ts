import { NextResponse } from "next/server";
import type { Browser } from "puppeteer-core";
import { launchBrowser } from "@/lib/browser";
import { getSiteOrigin, reportExists } from "@/lib/report";

/**
 * The results PDF, linked from the Zoho email: Chromium prints
 * /audit/report/[token] (the result screen rebuilt from MySQL). Generated on
 * each request — nothing is stored.
 *
 * Chromium loads the page through the public site URL: on Hostinger, local
 * ports between processes were refused. REPORT_RENDER_ORIGIN overrides it.
 */

// One Chromium at a time: each needs a few hundred MB on shared hosting.
let queue: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

/** Keeps cards and list rows whole across page breaks. */
const PRINT_CSS = `
  li, tr, dl, aside, .rounded-xl, .rounded-lg { break-inside: avoid; }
  h2 { break-after: avoid; }
`;

async function renderPdf(url: string) {
  let browser: Browser | undefined;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });
    if (!response?.ok()) {
      throw new Error(`Report page answered ${response?.status() ?? "nothing"} for ${url}`);
    }
    await page.emulateMediaType("screen");
    await page.addStyleTag({ content: PRINT_CSS });
    return await page.pdf({ format: "A4", printBackground: true, timeout: 45_000 });
  } finally {
    await browser?.close().catch(() => {});
  }
}

function fileName(brandName: string) {
  const slug = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "your"}-franchise-readiness-result.pdf`;
}

export async function GET(request: Request, ctx: RouteContext<"/api/report/[token]">) {
  const { token } = await ctx.params;

  let found: Awaited<ReturnType<typeof reportExists>>;
  try {
    found = await reportExists(token);
  } catch (error) {
    console.error("Report lookup failed", error);
    return new NextResponse("Your report could not be loaded right now. Please try again later.", {
      status: 500,
    });
  }
  if (!found) {
    return new NextResponse("This report link is not valid.", { status: 404 });
  }

  const origin = process.env.REPORT_RENDER_ORIGIN?.trim().replace(/\/+$/, "") || getSiteOrigin(request);
  try {
    const pdf = await oneAtATime(() => renderPdf(`${origin}/audit/report/${token}`));
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName(found.brandName)}"`,
        "Cache-Control": "private, max-age=300",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error(`Report PDF failed for ${origin}/audit/report/${token.slice(0, 6)}…`, error);
    return new NextResponse("Your report could not be generated right now. Please try again in a minute.", {
      status: 500,
    });
  }
}
