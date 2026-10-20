import Script from "next/script";

/** Google Ads account tag, as supplied by Corporate Culture (20 October 2026). */
export const GOOGLE_ADS_ID = "AW-18300527849";

/**
 * The Google Ads tag (gtag.js), on the free Audit's pages only: the landing
 * page, the questionnaire and the result. Never on the print view Chromium
 * renders for the PDF, and not on the paid Report's screens or the legal pages.
 * Loaded after the page is interactive, so it never delays the Audit.
 */
export function GoogleAdsTag() {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}
