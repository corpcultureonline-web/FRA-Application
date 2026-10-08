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
  // The app lives at corpculture.co/franchise-audit (CANONICAL-VALUES §4, T3).
  // basePath also prefixes /_next assets, so no assetPrefix is needed.
  basePath: BASE_PATH,

  env: { NEXT_PUBLIC_SENTRY_RELEASE: releaseSha() },

  async redirects() {
    return [
      // Only reached where the app owns the whole domain (the temporary one);
      // on corpculture.co, Nginx sends the root to WordPress.
      { source: "/", destination: BASE_PATH, basePath: false, permanent: false },
      // Result and PDF links issued before the base path — in Zoho records and
      // emails — still open.
      { source: "/api/report/:token", destination: `${BASE_PATH}/api/report/:token`, basePath: false, permanent: true },
      { source: "/audit/report/:token", destination: `${BASE_PATH}/audit/report/:token`, basePath: false, permanent: true },
    ];
  },
};

export default nextConfig;
