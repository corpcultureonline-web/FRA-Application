"use client";

import { useEffect } from "react";
import { claritySet, mirrorToGa } from "@/lib/analytics/vendors";
import { trackResultPage } from "@/lib/events/result-events";

/**
 * Result-page engagement and upgrade clicks, for the event log; the band as a
 * Clarity tag and result_viewed in GA4 (Instrumentation handoff §1.2, §3.3).
 * The band only, never the score: it is shown to the brand anyway. Renders nothing.
 */
export function ResultTracking({ bands }: { bands: string[] }) {
  const band = bands.join(",");
  useEffect(() => {
    if (band) claritySet("band", band.split(","));
    // result_viewed itself is written by the server; GA hears it from here.
    mirrorToGa("result_viewed", band ? { band } : {});
    return trackResultPage();
  }, [band]);
  return null;
}
