/**
 * Traffic attribution (Developer-Handoff-Identity-Attribution, 20 Nov 2026,
 * §3): normalised source and medium, click IDs and the channel rules. Pure, so
 * the browser (Clarity's source tag) and the server (/api/event, on write)
 * classify a visit the same way, and the rules are tested on their own.
 *
 * The raw UTMs are always kept beside these: the normalised fields are for
 * reporting, the raw ones are how the next broken ad URL is found (§3.2).
 */

export const CHANNELS = [
  "Meta Paid",
  "Google Paid",
  "Owned",
  "Organic Search",
  "Organic Social",
  "Referral",
  "Direct",
] as const;
export type Channel = (typeof CHANNELS)[number];

/** Click IDs in the order they are looked for (§3.3). Instagram's in-app browser keeps them more often than UTMs. */
export const CLICK_ID_PARAMS = ["fbclid", "gclid", "wbraid", "gbraid"] as const;
export type ClickIdType = (typeof CLICK_ID_PARAMS)[number];

export const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** The value written when utm_medium carries its own parameter name (the 1,184 sessions in §1). */
export const MALFORMED = "(malformed)";

/** Our own hosts: a visit from them never resets attribution (§3.4). */
const OWN_HOSTS = ["corpculture.co"];
/** Google's search-partner network: kept visible, never folded into Organic Search (§3.4). */
const GOOGLE_SEARCH_PARTNERS = ["syndicatedsearch.goog"];
const SEARCH_ENGINES = ["google.", "bing.com", "duckduckgo.com", "search.yahoo.com", "yandex.", "baidu.com", "ecosia.org"];
const SOCIAL_PLATFORMS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "fb.me",
  "messenger.com",
  "threads.net",
  "linkedin.com",
  "lnkd.in",
  "t.co",
  "x.com",
  "twitter.com",
  "youtube.com",
  "youtu.be",
  "whatsapp.com",
  "wa.me",
  "pinterest.com",
  "reddit.com",
];

const SOURCE_ALIASES: Record<string, string> = {
  ig: "instagram",
  instagram: "instagram",
  fb: "facebook",
  facebook: "facebook",
  google: "google",
};

const MEDIUM_ALIASES: Record<string, string> = {
  paid_social: "paid_social",
  paid: "paid_social",
  social: "organic_social",
  utm_medium: MALFORMED,
};

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** §3.2: ig / Instagram / instagram → instagram, and so on; anything else lowercased and trimmed. */
export function normaliseSource(raw: string | null | undefined) {
  const value = clean(raw)?.toLowerCase();
  if (!value) return null;
  return SOURCE_ALIASES[value] ?? value;
}

/** §3.2: the literal "utm_medium" becomes "(malformed)", never a real value. */
export function normaliseMedium(raw: string | null | undefined) {
  const value = clean(raw)?.toLowerCase();
  if (!value) return null;
  return MEDIUM_ALIASES[value] ?? value;
}

/** True when the host is the domain itself or one of its subdomains. */
function onDomain(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

/** A hostname, lowercased and without "www.", or null for an unusable referrer. */
export function referrerHost(referrer: string | null | undefined) {
  const value = clean(referrer);
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function isOwnHost(host: string | null) {
  return Boolean(host && OWN_HOSTS.some((domain) => onDomain(host, domain)));
}

function isSearchEngine(host: string) {
  return SEARCH_ENGINES.some((engine) =>
    engine.endsWith(".") ? host.startsWith(engine) || host.includes(`.${engine}`) : onDomain(host, engine),
  );
}

function isSocialPlatform(host: string) {
  return SOCIAL_PLATFORMS.some((platform) => onDomain(host, platform));
}

export type RawTouch = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_path?: string | null;
} & Partial<Record<ClickIdType, string | null>>;

export type Touch = {
  channel: Channel;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  referrer_host: string | null;
  landing_path: string | null;
  click_id: string | null;
  click_id_type: ClickIdType | null;
};

/** The first click ID present, in CLICK_ID_PARAMS order. */
export function clickIdOf(raw: RawTouch): { id: string; type: ClickIdType } | null {
  for (const type of CLICK_ID_PARAMS) {
    const id = clean(raw[type]);
    if (id) return { id: id.slice(0, 255), type };
  }
  return null;
}

/** True when the visit carries a campaign (any UTM or click ID): it starts a new session (§4). */
export function hasCampaign(raw: RawTouch) {
  return UTM_PARAMS.some((key) => clean(raw[key])) || clickIdOf(raw) !== null;
}

/**
 * The channel, by the rules of §3.4 in order, stopping at the first match.
 * A visit from our own domain with no campaign is a self-referral: it is not
 * a Referral, and the caller inherits the earlier channel (`selfReferral`).
 */
export function classify(raw: RawTouch): { touch: Touch; selfReferral: boolean } {
  const source = normaliseSource(raw.utm_source);
  const medium = normaliseMedium(raw.utm_medium);
  const click = clickIdOf(raw);
  const host = referrerHost(raw.referrer);
  const googleClick = click !== null && click.type !== "fbclid";

  let channel: Channel;
  let selfReferral = false;
  if (click?.type === "fbclid" || (source !== null && ["instagram", "facebook", "meta"].includes(source))) {
    channel = "Meta Paid";
  } else if (googleClick || (source === "google" && medium === "cpc")) {
    channel = "Google Paid";
  } else if (medium !== null && ["email", "whatsapp", "sms"].includes(medium)) {
    channel = "Owned";
  } else if (host && GOOGLE_SEARCH_PARTNERS.some((domain) => onDomain(host, domain))) {
    // A partner click with a Google click ID was caught above as Google Paid.
    channel = "Referral";
  } else if (host && isSearchEngine(host)) {
    channel = "Organic Search";
  } else if (host && isSocialPlatform(host)) {
    channel = "Organic Social";
  } else if (host && !isOwnHost(host)) {
    channel = "Referral";
  } else {
    channel = "Direct";
    selfReferral = isOwnHost(host) && !hasCampaign(raw);
  }

  return {
    touch: {
      channel,
      source,
      medium,
      campaign: clean(raw.utm_campaign)?.slice(0, 128) ?? null,
      content: clean(raw.utm_content)?.slice(0, 128) ?? null,
      term: clean(raw.utm_term)?.slice(0, 128) ?? null,
      referrer_host: host?.slice(0, 128) ?? null,
      landing_path: clean(raw.landing_path)?.slice(0, 255) ?? null,
      click_id: click?.id ?? null,
      click_id_type: click?.type ?? null,
    },
    selfReferral,
  };
}

/**
 * A short, stable signature of a visit's campaign, so the proxy can tell a
 * second ad click from a reload of the first (§4). Null with no campaign.
 */
export function campaignSignature(params: URLSearchParams) {
  const parts = [...UTM_PARAMS, ...CLICK_ID_PARAMS].map((key) => clean(params.get(key)) ?? "");
  if (parts.every((part) => !part)) return null;
  // FNV-1a: not security, just a compact cookie value.
  let hash = 0x811c9dc5;
  for (const char of parts.join("\u0000")) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}
