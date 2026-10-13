import { Arimo } from "next/font/google";

/**
 * Arimo — the open-source font metric-compatible with Arial — served with the
 * report, as a fallback after Helvetica and Arial. Browsers only download it
 * when neither is installed: in practice, Chromium on the server printing the
 * PDF, which would otherwise print the report with no text at all.
 * latin-ext carries the ₹ sign.
 */
export const reportFont = Arimo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-report",
  display: "block",
});
