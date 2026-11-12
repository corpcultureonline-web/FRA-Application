import Script from "next/script";

/** Microsoft Clarity project ID, as supplied by Corporate Culture (12 November 2026). */
export const CLARITY_PROJECT_ID = "zbxgfjk67t";
/** Clarity records the live app only, as Analytics does (GoogleTag): staging visits would land in the client's recordings. */
const CLARITY_HOST = "app.corpculture.co";

/**
 * Microsoft Clarity (heatmaps and session recordings), to see where visitors
 * leave the free Audit: the landing page, the questionnaire, find-my-result and
 * the result (/audit/result and /audit/report/{token}). Not on the Report's
 * screens, the legal pages or the panel; those are entered by a full load, so
 * Clarity, which follows in-app moves, never reaches them from a tracked page.
 *
 * Founders' data is masked in recordings (data-clarity-mask): every input, the
 * Review step, and the whole result page. Clarity cannot mask the page address,
 * so recordings of the result carry its token, which opens the brand's answers:
 * accepted by Corporate Culture (12 November 2026), so Clarity dashboard access
 * is access to every recorded result.
 *
 * Off in the PDF's print view and in automated browsers, like the Google tag;
 * loaded after the page is interactive, so it never delays the page.
 */
export function ClarityTag() {
  return (
    <Script id="clarity-tag" strategy="afterInteractive">
      {`(function (c, l, a, r, i, t, y) {
  if (new URLSearchParams(location.search).get("print") === "1" || navigator.webdriver) return;
  if (location.hostname !== "${CLARITY_HOST}") return;
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", ${JSON.stringify(CLARITY_PROJECT_ID)});`}
    </Script>
  );
}
