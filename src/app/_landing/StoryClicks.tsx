"use client";

import { useEffect } from "react";
import { track } from "@/lib/events/client";

const EVENTS = new Set(["story_cta_clicked", "story_watch_clicked"] as const);
type StoryEvent = typeof EVENTS extends Set<infer T> ? T : never;

/**
 * The founder block's two links (Instrumentation handoff, 20 Nov, §2.4):
 * elements marked data-story-click="<event>" are logged when tapped.
 * story_cta_clicked is the one that says whether the block adds Audit starts.
 * Renders nothing.
 */
export function StoryClicks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-story-click]");
      const type = target?.dataset.storyClick as StoryEvent | undefined;
      if (type && EVENTS.has(type)) track(type, { placement: "t1_landing_story" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
