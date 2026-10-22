import { after, NextResponse } from "next/server";
import type { Browser } from "puppeteer-core";
import { withBasePath } from "@/lib/base-path";
import { launchBrowser } from "@/lib/browser";
import { eventContext, logOrderEvent } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";
import { normaliseOrigin } from "@/lib/origin";
import { TIERS } from "@/lib/pricing";
import { getSiteOrigin } from "@/lib/report";
import { sentReport } from "@/lib/report/store";

/**
 * Download as PDF (Report library §3 route): Chromium prints the Report page's
 * print view, so the PDF and the page are the same Report from the same
 * stored document (§10). Generated on request; nothing is stored.
 */

// One Chromium at a time: each needs a few hundred MB on shared hosting.
let queue: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

const FOOTER = `
  <div style="width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;
              font-family: Helvetica, Arial, sans-serif; font-size: 8px; color: #7a7471;">
    <span>${TIERS.report.name}</span>
    <span class="pageNumber"></span>
  </div>`;

async function renderPdf(url: string) {
  let browser: Browser | undefined;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1200 });
    const response = await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });
    if (!response?.ok()) throw new Error(`Report page answered ${response?.status() ?? "nothing"} for ${url}`);
    await page.emulateMediaType("screen");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    return await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: FOOTER,
      margin: { top: "14mm", bottom: "18mm", left: "14mm", right: "14mm" },
      scale: 0.8,
      timeout: 45_000,
    });
  } finally {
    await browser?.close().catch(() => {});
  }
}

const fileName = (brand: string) =>
  `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "your"}-franchise-readiness-report.pdf`;

export async function GET(request: Request, ctx: RouteContext<"/report/my/[token]/pdf">) {
  const { token } = await ctx.params;
  let report: Awaited<ReturnType<typeof sentReport>>;
  try {
    report = await sentReport(token);
  } catch (error) {
    reportError("Report PDF lookup failed", error);
    return new NextResponse("Your Report could not be loaded right now. Please try again later.", { status: 500 });
  }
  if (typeof report === "string") return new NextResponse("This Report link is not valid.", { status: 404 });

  const origin = normaliseOrigin(process.env.REPORT_RENDER_ORIGIN) ?? getSiteOrigin(request);
  try {
    const pdf = await oneAtATime(() => renderPdf(`${origin}${withBasePath(`/report/my/${token}/report`)}?print=1`));
    const events = eventContext(request.headers);
    const { orderId, auditId } = report;
    after(() => logOrderEvent(events, "report_pdf_downloaded", { order_id: orderId }, orderId, auditId));
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName(report.document.cover.brand)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    reportError("Report PDF failed", error, { order_id: report.orderId });
    return new NextResponse("Your PDF could not be generated right now. Please try again in a minute.", { status: 500 });
  }
}
