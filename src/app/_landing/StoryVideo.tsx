"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

/**
 * The founder clip as a click-to-play façade (handoff, 13 November): a poster
 * and a play control, and the YouTube iframe injected only on tap. A live embed
 * inside Instagram's in-app browser hands the visitor to the YouTube app, out
 * of the funnel, and the page carries no player weight until someone chooses to
 * watch. With no clip yet (videoId null), the poster shows alone: no control
 * that plays nothing.
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
  const [playing, setPlaying] = useState(false);
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
    return (
      <div className={frame}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0`}
          title={playLabel}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={playLabel}
      className={`${frame} group block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink`}
    >
      {picture}
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cta ring-[10px] ring-cta/30 transition-transform group-hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="ml-1 size-8 text-ink">
          <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
