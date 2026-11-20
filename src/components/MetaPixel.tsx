import Script from "next/script";

/** Meta Pixel ID, as supplied by Corporate Culture (20 November 2026). */
export const META_PIXEL_ID = "873475471907499";

/**
 * The Meta Pixel (PageView), as supplied by Corporate Culture: on every Tier 1
 * and Tier 2 page (the landing page, the Audit questionnaire, find-my-result,
 * the result, every Report screen) and the legal pages. Not on the panel.
 * Runs on staging and live alike, as Corporate Culture asked (20 November 2026).
 *
 * Meta is sent each page's full address and referrer, which on the result and
 * the Report carry their private tokens (/audit/report/{token}, ?audit=,
 * /report/my/{token}, /report/resume/{token}): unlike the Google tag, they are
 * not masked. The privacy notice is not changed for it, as Corporate Culture
 * asked (20 November 2026).
 *
 * Off in the PDF's print view and in automated browsers, like the Google tag
 * and Clarity; loaded after the page is interactive, so it never delays the page.
 * The Script id loads it once per visit, so in-app moves are not counted twice.
 */
export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`(function () {
  if (new URLSearchParams(location.search).get("print") === "1" || navigator.webdriver) return;
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', ${JSON.stringify(META_PIXEL_ID)});
  fbq('track', 'PageView');
})();`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's no-JavaScript beacon, not a content image. */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
