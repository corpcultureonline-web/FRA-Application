import "server-only";
import { withBasePath } from "@/lib/base-path";
import { SITE_ORIGIN } from "@/lib/seo";
import { plain } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import type { Email } from "./email";

/**
 * The two resume emails (Messages v1.2 §4 and §6), built from their library
 * keys and nothing else. Plain text first; the HTML adds layout, never words
 * (§1). No tracking pixel, no attachment, no unsubscribe.
 */

export function resumeUrl(token: string) {
  return `${SITE_ORIGIN}${withBasePath(`/report/resume/${token}`)}`;
}

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function compose({
  to,
  subject,
  lines,
  button,
  url,
  after,
}: {
  to: string;
  subject: string;
  lines: string[];
  button: string;
  url: string;
  after: string[];
}): Email {
  const text = [...lines, `${button}: ${url}`, ...after].join("\n\n");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#231f20">
<div style="max-width:520px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${escape(lines[0])}</h1>
${lines
  .slice(1)
  .map((line) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">${escape(line)}</p>`)
  .join("\n")}
<p style="margin:24px 0"><a href="${escape(url)}" style="display:inline-block;padding:14px 24px;border-radius:6px;background:#f78f1e;color:#231f20;font-weight:bold;text-decoration:none">${escape(button)}</a></p>
${after.map((line) => `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#57524f">${escape(line)}</p>`).join("\n")}
</div></body></html>`;
  return { to, subject, text, html };
}

/** §4: sent at the start of a paid run, before the first answer (T32). */
export function resumeEmail(to: string, token: string): Email {
  return compose({
    to,
    subject: plain(t2("T2M-RESUME-SUBJ")),
    lines: [plain(t2("T2M-RESUME-HEAD")), plain(t2("T2M-RESUME-BODY"))],
    button: plain(t2("T2M-RESUME-BTN")),
    url: resumeUrl(token),
    after: [plain(t2("T2M-RESUME-PRIVATE"))],
  });
}

/** §6: sent from Screen 7's expired state, to the address on the order. */
export function relinkEmail(to: string, token: string): Email {
  return compose({
    to,
    subject: plain(t2("T2M-RELINK-SUBJ")),
    lines: [plain(t2("T2M-RELINK-HEAD")), plain(t2("T2M-RELINK-BODY"))],
    button: plain(t2("T2M-RELINK-BTN")),
    url: resumeUrl(token),
    after: [],
  });
}
