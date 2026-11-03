import "server-only";
import type { Email } from "./email";

/**
 * The layout every Tier 2 email shares (Messages v1.2 §1): a heading, the
 * lines, an optional button, and quieter lines after it. Plain text first; the
 * HTML adds layout, never words. No tracking pixel, no unsubscribe.
 */

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** `**bold**` in a library line, as <strong> in HTML and plain in text. */
const html = (line: string) => escape(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const text = (line: string) => line.replace(/\*\*(.+?)\*\*/g, "$1");

export function compose({
  to,
  subject,
  lines,
  button,
  after = [],
}: {
  to: string;
  subject: string;
  /** The first line is the heading. */
  lines: string[];
  button?: { label: string; url: string };
  after?: string[];
}): Email {
  const plainText = [...lines.map(text), ...(button ? [`${text(button.label)}: ${button.url}`] : []), ...after.map(text)].join("\n\n");
  const body = `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#231f20">
<div style="max-width:520px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${html(lines[0])}</h1>
${lines
  .slice(1)
  .map((line) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">${html(line)}</p>`)
  .join("\n")}
${
  button
    ? `<p style="margin:24px 0"><a href="${escape(button.url)}" style="display:inline-block;padding:14px 24px;border-radius:6px;background:#f78f1e;color:#231f20;font-weight:bold;text-decoration:none">${html(text(button.label))}</a></p>`
    : ""
}
${after.map((line) => `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#57524f">${html(line)}</p>`).join("\n")}
</div></body></html>`;
  return { to, subject: text(subject), text: plainText, html: body };
}
