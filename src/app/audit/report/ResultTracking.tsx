"use client";

import { useEffect } from "react";
import { trackResultPage } from "@/lib/events/result-events";

/** Result-page engagement and upgrade clicks, for the event log. Renders nothing. */
export function ResultTracking() {
  useEffect(() => trackResultPage(), []);
  return null;
}
