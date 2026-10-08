/**
 * Where the app is served: corpculture.co/franchise-audit (CANONICAL-VALUES §4,
 * decision T3). next.config.ts reads this, so it is the one place to change it.
 *
 * <Link>, the router and statically imported images get the prefix
 * automatically. Anything hand-written does not: fetch() and sendBeacon()
 * paths, and absolute URLs built on the server (the PDF link, the page
 * Chromium prints). Build those with withBasePath().
 */
export const BASE_PATH = "/franchise-audit";

/** "/api/audit" → "/franchise-audit/api/audit". */
export function withBasePath(path: string) {
  return `${BASE_PATH}${path}`;
}
