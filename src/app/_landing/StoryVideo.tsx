"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { playClicked, trackPlayer, watchImpression } from "@/lib/events/video-events";

/** The founder block on the Audit's landing page, as the event log names it (Instrumentation handoff §2.3). */
const PLACEMENT = "t1_landing_story";

/**
 * The founder clip as a click-to-play façade (handoff, 13 November): a poster
 * and a play control, and the YouTube iframe injected only on tap. A live embed
 * inside Instagram's in-app browser hands the visitor to the YouTube app, out
 * of the funnel, and the page carries no player weight until someone chooses to
 * watch. With no clip yet (videoId null), the poster shows alone: no control
 * that plays nothing.
 *
 * Measured without giving up the façade (Instrumentation handoff, 20 Nov,
 * §2): the impression and the tap are ours; the YouTube IFrame API is
 * attached to the injected youtube-nocookie iframe only after the tap.
 */
export function StoryVideo({
  poster,
  alt,
  videoId,
  playLabel,
}: {
  poster: StaticImageData;
  alt: string;
  videoId: string | null;
  /** T1L-STORY-PLAY: announced to screen readers, never printed. */
  playLabel: string;
}) {
  const [clickedAt, setClickedAt] = useState<number | null>(null);
  const playing = clickedAt !== null;
  const box = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!videoId || !box.current) return;
    return watchImpression(box.current, PLACEMENT, videoId);
  }, [videoId]);

  useEffect(() => {
    if (!videoId || clickedAt === null || !iframe.current) return;
    return trackPlayer(iframe.current, PLACEMENT, videoId, clickedAt);
  }, [videoId, clickedAt]);

  const frame = "relative aspect-square w-full overflow-hidden rounded-lg bg-ink";
  const picture = (
    <Image
      src={poster}
      alt={videoId ? "" : alt}
      fill
      sizes="(min-width: 768px) 460px, 100vw"
      placeholder="blur"
      className="object-cover"
    />
  );

  if (!videoId) return <div className={frame}>{picture}</div>;

  if (playing) {
    // enablejsapi and origin let the IFrame API attach to this frame (YouTube's documented path).
    const query = new URLSearchParams({
      autoplay: "1",
      playsinline: "1",
      rel: "0",
      enablejsapi: "1",
      origin: location.origin,
    });
    // The clip is 16:9 and the poster square: the frame takes the clip's shape on tap, so it plays without bars.
    return (
      <div ref={box} className="relative aspect-video w-full overflow-hidden rounded-lg bg-ink">
        <iframe
          ref={iframe}
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${query}`}
          title={playLabel}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
    );
  }

  return (
    <div ref={box}>
      <button
        type="button"
        onClick={() => setClickedAt(playClicked(PLACEMENT, videoId))}
        aria-label={playLabel}
        className={`${frame} group block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink`}
      >
        {picture}
        {/* Top right, clear of Ronak's face at the centre of the poster. */}
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 flex size-12 items-center justify-center rounded-full bg-cta shadow-lg ring-4 ring-cta/30 transition-transform group-hover:scale-105 sm:size-14 sm:ring-[6px]"
        >
          <svg viewBox="0 0 24 24" className="ml-0.5 size-6 text-ink sm:size-7">
            <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
          </svg>
        </span>
      </button>
    </div>
  );
}
