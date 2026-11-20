"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { funnelPosition } from "@/lib/analytics/funnel";
import { claritySet } from "@/lib/analytics/vendors";
import { markPage, startTracking } from "@/lib/events/client";

/**
 * Starts the event log tracker once, resets the page timer on navigation, and
 * tags the page's place in the funnel in Clarity (Instrumentation handoff §1.2).
 */
export function EventTracker() {
  const pathname = usePathname();

  useEffect(() => {
    startTracking();
  }, []);

  useEffect(() => {
    markPage(pathname);
    const position = funnelPosition(pathname);
    if (position) {
      claritySet("tier", position.tier);
      claritySet("stage", position.stage);
    }
  }, [pathname]);

  return null;
}
