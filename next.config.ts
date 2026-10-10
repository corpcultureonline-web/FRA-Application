import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

/** Sentry release tag: the deploy's commit SHA, so a regression points at a deploy. */
function releaseSha() {
  if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  // The app is served under /franchise-audit (CANONICAL-VALUES §4), live at
  // app.corpculture.co/franchise-audit.
  // basePath also prefixes /_next assets, so no assetPrefix is needed.
  basePath: BASE_PATH,

  env: { NEXT_PUBLIC_SENTRY_RELEASE: releaseSha() },

  async redirects() {
    return [
      // The domain root, where the app owns the whole (sub)domain.
      { source: "/", destination: BASE_PATH, basePath: false, permanent: false },
      // Crawlers and browsers ask for these at the domain root, outside the base
      // path. Next.js only allows redirects there, not rewrites; Google follows
      // a redirected robots.txt, and robots.txt names the sitemap's real address.
      { source: "/robots.txt", destination: `${BASE_PATH}/robots.txt`, basePath: false, permanent: true },
      { source: "/sitemap.xml", destination: `${BASE_PATH}/sitemap.xml`, basePath: false, permanent: true },
      { source: "/favicon.ico", destination: `${BASE_PATH}/favicon.ico`, basePath: false, permanent: true },
      // Result and PDF links issued before the base path — in Zoho records and
      // emails — still open.
      { source: "/api/report/:token", destination: `${BASE_PATH}/api/report/:token`, basePath: false, permanent: true },
      { source: "/audit/report/:token", destination: `${BASE_PATH}/audit/report/:token`, basePath: false, permanent: true },
    ];
  },
};

export default nextConfig;
