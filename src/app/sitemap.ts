import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "@/lib/seo";

/** The landing page is the only indexed page (Decision T17). Lives at /franchise-audit/sitemap.xml. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: CANONICAL_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
