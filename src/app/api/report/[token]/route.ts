import { NextResponse } from "next/server";
import type { Browser } from "puppeteer-core";
import { launchBrowser } from "@/lib/browser";
import { getSiteOrigin, reportExists } from "@/lib/report";

/**
 * The results PDF, linked from the Zoho email: Chromium prints
 * /audit/report/[token]?print=1 — the same page the founder sees after the
 * audit. Generated on each request; nothing is stored.
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

/** "Franchise Readiness Audit" and the page number, as in the approved sample. */
const FOOTER = `
  <div style="width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;
              font-family: Helvetica, Arial, sans-serif; font-size: 8px; color: #7a7471;">
    <span>Franchise Readiness Audit</span>
    <span class="pageNumber"></span>
  </div>`;

/**
 * Print scales, preferred first. 0.85 matches the sample's type size (the
 * page itself is sized for screens); the tighter ones apply rule R9.
 */
const SCALES = [0.85, 0.82, 0.78];

function pageCount(pdf: Uint8Array) {
  return (Buffer.from(pdf).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

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
    const print = (scale: number) =>
      page.pdf({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: FOOTER,
        margin: { top: "14mm", bottom: "18mm", left: "16mm", right: "16mm" },
        scale,
        timeout: 45_000,
      });

    // R9: the offer + bio block never splits (R8), so it can leave a large gap
    // before the last page. If a slightly tighter scale saves a page, use it.
    const first = await print(SCALES[0]);
    const pages = pageCount(first);
    for (const scale of SCALES.slice(1)) {
      const tighter = await print(scale);
      if (pageCount(tighter) < pages) return tighter;
    }
    return first;
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
    const pdf = await oneAtATime(() => renderPdf(`${origin}/audit/report/${token}?print=1`));
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
