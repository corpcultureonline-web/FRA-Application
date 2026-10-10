"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { markPage, startTracking } from "@/lib/events/client";

/** Starts the event log tracker once, and resets the page timer on navigation. */
export function EventTracker() {
  const pathname = usePathname();

  useEffect(() => {
    startTracking();
  }, []);

  useEffect(() => {
    markPage(pathname);
  }, [pathname]);

  return null;
}
