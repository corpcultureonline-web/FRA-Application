import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "@/lib/seo";

/**
 * Lives at /franchise-audit/robots.txt; the domain root's /robots.txt redirects
 * here (next.config.ts), since crawlers only look at the root.
 *
 * The audit and result pages are not blocked: they carry noindex, and a
 * crawler must be able to fetch a page to see that. Only the API is off-limits.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/franchise-audit/api/"] }],
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
