import Script from "next/script";
import { BASE_PATH } from "@/lib/base-path";

/** Google Ads account tag, as supplied by Corporate Culture (20 October 2026). */
export const GOOGLE_ADS_ID = "AW-18300527849";

/**
 * The Google Ads tag (gtag.js), on the free Audit's pages only: the landing
 * page, the questionnaire and the result. Never on the print view Chromium
 * renders for the PDF, and not on the paid Report's screens or the legal pages.
 * Loaded after the page is interactive, so it never delays the Audit.
 *
 * `path` replaces the page address the tag reports, for a page whose real
 * address carries a private token (the result, /audit/report/{token}): the tag
 * otherwise sends Google the full URL, and the token opens every answer the
 * brand gave (staging test, 2 Nov 2026, T2). Relative to the base path.
 */
export function GoogleAdsTag({ path }: { path?: string } = {}) {
  const config = path ? `, { page_location: location.origin + ${JSON.stringify(BASE_PATH + path)} }` : "";
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}'${config});`}
      </Script>
    </>
  );
}
