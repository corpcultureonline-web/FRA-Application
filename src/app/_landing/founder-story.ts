/**
 * The founder block — Content-Library-Tier1-Landing.md v1.7 §7 (13 November
 * 2026, T186/T188; src/content/tier1), copied verbatim and keyed as the
 * library keys them. It replaces "Who conducts your audit": its T1L-BIO-* keys
 * move in unrenamed, T1L-BIO-KICKER is retired, and the stats are
 * FOUNDER_STATS (T1L-STAT-*, lib/company.ts).
 */
export const T1L_STORY = {
  "T1L-STORY-KICKER": "Why this audit exists",
  "T1L-STORY-HEAD": "The 11 questions came from two businesses I lost.",
  /** The play control's accessible label: announced, never printed. */
  "T1L-STORY-PLAY": "Play Ronak's story · 35 seconds",
  "T1L-STORY-WATCH": "Watch the full story · 7 min",
  "T1L-STORY-BODY-1":
    "The first depended entirely on me. I couldn't open a second outlet because there was no second me — and when the property was sold, everything I'd built went with it.",
  "T1L-STORY-BODY-2":
    "The second had a team, systems and five outlets in eighteen months. It also had a broken model, and every new outlet made the leak bigger. Growth doesn't fix a broken business. It multiplies it.",
  "T1L-STORY-BRIDGE":
    "Both could have been caught early, if someone had asked the right questions before I invested. That is what these 11 questions ask.",
  "T1L-STORY-CTA": "Start the audit",
  "T1L-STORY-CTA-SUB": "11 questions. About 4 minutes. Free.",

  "T1L-BIO-NAME": "Ronak Patel",
  "T1L-BIO-ROLE": "Founder & CEO, Corporate Culture",
  "T1L-BIO-BODY":
    "Consumer brands across F&B, retail, lifestyle, wellness and education — scaled with structure, funding access and long-term expansion clarity.",
} as const;

/** Lifted as a pull-quote, but it stays inside T1L-STORY-BODY-2 so the key remains one string (§7). */
export const STORY_PULL_QUOTE = "Growth doesn't fix a broken business. It multiplies it.";

/** T1L-STORY-BODY-2 split for display: the lead-in, then the pull-quote that ends it. */
export function splitBody2(body: string = T1L_STORY["T1L-STORY-BODY-2"]) {
  const at = body.lastIndexOf(STORY_PULL_QUOTE);
  if (at === -1) return { lead: body, quote: null };
  return { lead: body.slice(0, at).trim(), quote: STORY_PULL_QUOTE };
}

/**
 * The 35-second clip, a YouTube video ID. It does not exist yet (handoff, 13
 * November): while this is null the poster shows with no play control, because
 * a play button that plays nothing is worse than none. Set it and the façade
 * goes live: poster and play control, the iframe injected only on tap.
 */
export const STORY_CLIP_YOUTUBE_ID: string | null = null;

/**
 * T1L-STORY-WATCH's target: the founder article on corpculture.co, same tab,
 * never YouTube (T188). The article is not built yet, and until it is the link
 * is not rendered at all: hidden, not disabled.
 */
export const STORY_ARTICLE_URL: string | null = null;
