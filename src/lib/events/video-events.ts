/**
 * The founder video's events (Instrumentation handoff, 20 Nov 2026, §2.3),
 * with the YouTube IFrame API attached to the façade's own iframe at the
 * moment it is injected (§2.1–§2.2). Browser only; never throws.
 *
 * Player states, from YouTube's reference: -1 unstarted, 0 ended, 1 playing,
 * 2 paused, 3 buffering, 5 cued.
 */
import { onPageExit, startTracking, track, trackingIds } from "./client";

type YTPlayer = { getCurrentTime(): number; getDuration(): number; destroy(): void };
type YTNamespace = {
  Player: new (el: HTMLIFrameElement, options: { events: { onStateChange: (e: { data: number }) => void } }) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const MILESTONES = [25, 50, 75];
const IMPRESSION_KEY = "fra_video_impression";

let ytReady: Promise<YTNamespace> | null = null;

/** Loads the IFrame API once per page, keeping any earlier ready-callback. */
function loadYT() {
  ytReady ??= new Promise<YTNamespace>((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return ytReady;
}

/**
 * video_impression: the block at least half on screen for a second, once per
 * session. Returns the cleanup.
 */
export function watchImpression(el: Element, placement: string, videoId: string) {
  if (typeof IntersectionObserver === "undefined") return () => {};
  let timer: number | undefined;
  const observer = new IntersectionObserver(
    ([entry]) => {
      window.clearTimeout(timer);
      if (!entry?.isIntersecting) return;
      timer = window.setTimeout(() => {
        startTracking();
        const { sessionId } = trackingIds();
        let seen: string | null = null;
        try {
          seen = localStorage.getItem(IMPRESSION_KEY);
        } catch {}
        observer.disconnect();
        if (!sessionId || seen === `${sessionId}:${placement}`) return;
        try {
          localStorage.setItem(IMPRESSION_KEY, `${sessionId}:${placement}`);
        } catch {}
        track("video_impression", { placement, video_id: videoId });
      }, 1000);
    },
    { threshold: 0.5 },
  );
  observer.observe(el);
  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
  };
}

/** video_play_click: the tap on the façade, before YouTube loads — the true intent signal. */
export function playClicked(placement: string, videoId: string) {
  track("video_play_click", { placement, video_id: videoId });
  return Date.now();
}

/**
 * Attaches to the injected iframe and reports started, progress (25/50/75,
 * once each, polled every second while playing), paused, completed, and
 * abandoned if the page is left mid-video. Returns the cleanup.
 */
export function trackPlayer(iframe: HTMLIFrameElement, placement: string, videoId: string, clickedAt: number) {
  let player: YTPlayer | null = null;
  let state = -1;
  let started = false;
  let abandonedSent = false;
  let poll: number | undefined;
  let stopped = false;
  const reached = new Set<number>();

  const position = () => {
    const at = player?.getCurrentTime() ?? 0;
    const duration = player?.getDuration() ?? 0;
    return {
      position_s: Math.round(at * 10) / 10,
      duration_s: Math.round(duration),
      // getDuration() is 0 until the metadata loads: no percentage until then.
      pct: duration > 0 ? Math.min(100, Math.round((at / duration) * 100)) : null,
    };
  };
  const payload = (extra: Record<string, unknown> = {}) => ({
    placement,
    video_id: videoId,
    ...position(),
    ms_since_play_click: Date.now() - clickedAt,
    ...extra,
  });

  const checkProgress = () => {
    const duration = player?.getDuration() ?? 0;
    if (duration <= 0) return;
    const pct = ((player?.getCurrentTime() ?? 0) / duration) * 100;
    for (const milestone of MILESTONES) {
      if (pct >= milestone && !reached.has(milestone)) {
        reached.add(milestone);
        track("video_progress", payload({ pct: milestone }));
      }
    }
  };
  const stopPolling = () => {
    window.clearInterval(poll);
    poll = undefined;
  };

  const onStateChange = ({ data }: { data: number }) => {
    try {
      state = data;
      if (data === PLAYING) {
        if (!started) {
          started = true;
          track("video_started", payload());
        }
        poll ??= window.setInterval(checkProgress, 1000);
      } else if (data === PAUSED) {
        stopPolling();
        track("video_paused", payload());
      } else if (data === ENDED) {
        stopPolling();
        checkProgress();
        track("video_completed", payload({ pct: 100 }));
      }
    } catch {}
  };

  const stopExit = onPageExit(() => {
    if (abandonedSent || (state !== PLAYING && state !== PAUSED)) return;
    abandonedSent = true;
    try {
      return [{ type: "video_abandoned" as const, at: Date.now(), payload: payload() }];
    } catch {
      return;
    }
  });

  loadYT()
    .then((YT) => {
      if (!stopped) player = new YT.Player(iframe, { events: { onStateChange } });
    })
    .catch(() => {});

  return () => {
    stopped = true;
    stopPolling();
    stopExit();
  };
}
