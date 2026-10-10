/**
 * Regenerates public/sample-report.pdf — the "See a sample report" PDF on the
 * landing page — from the app itself, so the sample always matches what a
 * founder receives. Strings' answers (test vector), printed with the same
 * layout settings as /api/report/[token].
 *
 * 1. npm run build
 * 2. Start it with Zoho off, so no CRM record is created:
 *      ZOHO_CLIENT_ID= ZOHO_CLIENT_SECRET= ZOHO_REFRESH_TOKEN= SITE_URL=http://localhost:3100 npx next start -p 3100
 * 3. node scripts/generate-sample-report.ts
 *
 * Uses a local Chrome or Edge: set CHROME_PATH if it is not Edge's default path.
 * The submission is saved to the local database, marked internal.
 */
import { writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { VECTORS } from "../src/lib/scoring/test-vectors.ts";

const LOCAL = "http://localhost:3100";
const LIVE = "https://app.corpculture.co";
const strings = VECTORS.find((v) => v.brand === "Strings")!;

// Same footer, margins and scale rule (R9) as src/app/api/report/[token]/route.ts.
const FOOTER = `
  <div style="width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;
              font-family: Helvetica, Arial, sans-serif; font-size: 8px; color: #7a7471;">
    <span>Franchise Readiness Audit</span>
    <span class="pageNumber"></span>
  </div>`;
const SCALES = [0.85, 0.82, 0.78];
const pageCount = (pdf: Uint8Array) => (Buffer.from(pdf).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

const res = await fetch(`${LOCAL}/franchise-audit/api/audit?internal=1`, {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie: "fra_internal=1" },
  body: JSON.stringify({
    profile: { brandName: "Strings Music and Arts Academy", founderName: "Sample", email: "sample@corpculture.co", category: "Services", outlets: "1", city: "Chennai" },
    answers: strings.answers,
  }),
});
const { reportToken, score } = (await res.json()) as { reportToken: string; score: { range: { low: number; high: number } } };
console.log("scored", score.range);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const page = await browser.newPage();
const r = await page.goto(`${LOCAL}/franchise-audit/audit/report/${reportToken}?print=1`, { waitUntil: "networkidle0", timeout: 120000 });
if (!r?.ok()) throw new Error(`print page ${r?.status()}`);
// A sample has no result page of its own: its button starts the audit, and every link points at the live site.
await page.evaluate((local, live) => {
  for (const a of document.querySelectorAll("a[href]")) {
    const el = a as HTMLAnchorElement;
    if (/full-report|audit\/report\//.test(el.href)) el.href = `${live}/franchise-audit/audit`;
    else if (el.href.startsWith(local)) el.href = live + el.href.slice(local.length);
  }
}, LOCAL, LIVE);
await page.emulateMediaType("screen");
const print = (scale: number) => page.pdf({ format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: FOOTER, margin: { top: "14mm", bottom: "18mm", left: "16mm", right: "16mm" }, scale });
let pdf = await print(SCALES[0]);
const pages = pageCount(pdf);
for (const s of SCALES.slice(1)) { const t = await print(s); if (pageCount(t) < pages) { pdf = t; break; } }
writeFileSync("public/sample-report.pdf", pdf);
console.log("pages", pageCount(pdf), "bytes", pdf.length, "links", await page.$$eval("a[href]", (as) => [...new Set(as.map((a) => (a as HTMLAnchorElement).href))]));
await browser.close();
