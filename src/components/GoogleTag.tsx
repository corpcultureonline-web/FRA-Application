import Script from "next/script";

/** Google Ads account tag, as supplied by Corporate Culture (20 October 2026). */
export const GOOGLE_ADS_ID = "AW-18300527849";
/** Google Analytics 4 measurement ID, as supplied by Corporate Culture (10 November 2026). */
export const GOOGLE_ANALYTICS_ID = "G-X7XCSFPYBB";
/** Analytics counts the live app only: staging visits would land in the client's reports. */
const ANALYTICS_HOST = "app.corpculture.co";

/**
 * Addresses that carry a private token in the path. The token opens every
 * answer the brand gave (staging test, 2 Nov 2026, T2), so Google is sent the
 * address without it: /audit/report/{token} → /audit/report.
 */
const TOKEN_PATH = String.raw`(\/(?:audit\/report|report\/my|report\/resume))\/[^\/]+`;
/** Query parameters Google may see: campaign tags and ad click IDs. Every other one (?audit=, ?s=) is dropped. */
const KEPT_PARAM = String.raw`^(utm_[a-z_]+|gclid|gbraid|wbraid|dclid)$`;
/**
 * The one token page whose own address changes in place: the Report
 * questionnaire (?s= at each step). No tag there yet. Section anchors (the
 * Report, the result) send nothing (browser test, 10 Nov 2026).
 */
const UNTRACKED_PATH = String.raw`\/report\/my\/[^\/]+\/questions(\/|$)`;

/**
 * The Google tag (gtag.js): Google Ads on the free Audit's pages (the landing
 * page, the questionnaire and the result), Google Analytics on those, on
 * find-my-result and on the Report's screens. Not on the legal pages or the
 * panel, and it stays off in the print view Chromium renders for a PDF
 * (print=1) and in automated browsers, as the event log does. Loaded after the
 * page is interactive, so it never delays the page.
 *
 * The page and referrer addresses Google is given are masked. That holds for
 * a full page load only: when the address changes in place (a Link, ?s=,
 * back), gtag.js reports the real address whatever it was given,
 * Google Ads always reports the real path, and Analytics' form events carry
 * the form's real target (browser tests, 10 Nov 2026). So token pages are
 * entered and left by full loads (plain <a>, location.assign), and the one
 * that changes its address in place carries no tag.
 */
export function GoogleTag({ ads = true }: { ads?: boolean } = {}) {
  return (
    <Script id="google-tag" strategy="afterInteractive">
      {`(function () {
  if (new URLSearchParams(location.search).get("print") === "1" || navigator.webdriver) return;
  if (new RegExp(${JSON.stringify(UNTRACKED_PATH)}).test(location.pathname)) return;
  var analytics = location.hostname === "${ANALYTICS_HOST}";
  var ads = ${ads};
  if (!ads && !analytics) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  var tokenPath = new RegExp(${JSON.stringify(TOKEN_PATH)});
  var keptParam = new RegExp(${JSON.stringify(KEPT_PARAM)});
  function mask(address) {
    var url = new URL(address, location.href);
    if (url.origin !== location.origin) return url.origin + "/";
    var query = new URLSearchParams();
    url.searchParams.forEach(function (value, key) { if (keptParam.test(key)) query.append(key, value); });
    var search = query.toString();
    return url.origin + url.pathname.replace(tokenPath, "$1") + (search ? "?" + search : "");
  }
  var masked = { page_location: mask(location.href), page_referrer: document.referrer ? mask(document.referrer) : "" };
  gtag("set", masked);
  gtag("js", new Date());
  if (ads) gtag("config", "${GOOGLE_ADS_ID}", masked);
  if (analytics) gtag("config", "${GOOGLE_ANALYTICS_ID}", masked);
  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + (ads ? "${GOOGLE_ADS_ID}" : "${GOOGLE_ANALYTICS_ID}");
  document.head.appendChild(script);
})();`}
    </Script>
  );
}
