import type { MetadataRoute } from "next";
import { CANONICAL_URL, isNoIndex } from "@/lib/seo";

// Read at request time, so SITE_NOINDEX takes effect without a rebuild.
export const dynamic = "force-dynamic";

/**
 * Lives at /franchise-audit/robots.txt; the domain root's /robots.txt redirects
 * here (next.config.ts), since crawlers only look at the root.
 *
 * The audit and result pages are not blocked: they carry noindex, and a
 * crawler must be able to fetch a page to see that. Only the API is off-limits.
 */
export default function robots(): MetadataRoute.Robots {
  // A staging copy (SITE_NOINDEX): no crawling at all, and no sitemap.
  if (isNoIndex()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/franchise-audit/api/"] }],
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
