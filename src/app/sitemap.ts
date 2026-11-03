import type { MetadataRoute } from "next";
import { CANONICAL_URL, isNoIndex } from "@/lib/seo";

// Read at request time, as robots.ts is, so SITE_NOINDEX takes effect without a rebuild.
export const dynamic = "force-dynamic";

/**
 * The landing page is the only indexed page (Decision T17). Lives at /franchise-audit/sitemap.xml.
 * A staging copy (SITE_NOINDEX) lists nothing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (isNoIndex()) return [];
  return [{ url: CANONICAL_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
