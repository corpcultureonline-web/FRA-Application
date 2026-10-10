/**
 * Search and sharing metadata for the landing page — the only indexed page
 * (Decision T17). Title and description approved 10 October 2026.
 */
import { BASE_PATH } from "./base-path.ts";
import { normaliseOrigin } from "./origin.ts";

/** The live site. SITE_URL wins, so a staging build points at itself. */
export const SITE_ORIGIN = normaliseOrigin(process.env.SITE_URL) ?? "https://app.corpculture.co";

/** The one address search engines should index for this page. */
export const CANONICAL_URL = `${SITE_ORIGIN}${BASE_PATH}`;

export const SEO_TITLE = "Is Your Business Ready to Franchise? Free Readiness Audit";

export const SEO_DESCRIPTION =
  "Find out if your business is ready to franchise. A free 11-question audit scores 7 areas, including profit, systems and support, in about 4 minutes.";

/** Corporate Culture's main site, for the Organization in structured data. */
export const ORGANIZATION_URL = "https://corpculture.co";
