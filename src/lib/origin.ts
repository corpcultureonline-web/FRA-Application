/**
 * Turns a configured site address (SITE_URL, REPORT_RENDER_ORIGIN) into a bare
 * origin, forgiving the usual hosting-panel slips: no scheme, quotes, spaces,
 * a trailing slash, or a path such as /franchise-audit (the base path is
 * added separately, so keeping it would double it).
 *
 * "app.corpculture.co"                      → "https://app.corpculture.co"
 * "https://app.corpculture.co/franchise-audit" → "https://app.corpculture.co"
 *
 * Null when the value is empty or cannot be an http(s) address, so callers
 * fall back to the request's own host instead of building a broken link.
 */
export function normaliseOrigin(raw: string | undefined | null): string | null {
  const value = raw?.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}
