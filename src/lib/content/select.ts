import { evaluate, parseTrigger, type Facts, type Trigger } from "./triggers.ts";

/** A row of `content_piece` (Content Library §1.1). */
export type ContentPiece = {
  id: string;
  section: string;
  note_type: "ok" | "warn" | "mile" | null;
  priority: number;
  trigger_expr: string;
  heading: string | null;
  body: string;
  active: boolean;
};

export type NoteKind = "strength" | "milestone" | "watch";

type Note = { kind: NoteKind; text: string };
type Item = { heading: string; body: string };

export type ReportContent = {
  /** Score box: the fixed opener, then the band-keyed closer. */
  scoreNote: string[];
  /** Under the badge, only when a gate fires. */
  gateReason: string | null;
  toldUs: string[];
  noticed: Item[];
  /** Keyed by pillar code. */
  subtitles: Record<string, string>;
  importantPoints: Note[];
  legal: Note[];
  nutshell: string[];
  cannotTell: { intro: string | null; items: Item[] } | null;
  /** Keyed by band code (B5…B1); intro and closing line around the five rows. */
  ladder: { intro: string | null; bodies: Record<string, string>; close: string | null };
  canDoNow: { lead: string | null; actions: Item[]; fallback: string | null } | null;
  upgrade: { heading: string | null; title: string | null; body: string } | null;
};

/**
 * Slots a piece may use (§1.3). `{overall}` is deliberately absent and must
 * never be added: the point score never leaves the server (spec §4).
 */
export const SLOTS = [
  "brand", "city", "low", "high", "band", "weakest_area", "weak_count", "weak_list",
  // Restatements of the chosen options, for "What you told us" (§4c).
  "outlets_label", "UE01_label", "UE02_label", "OR01_label", "OR02_label",
  "PP01_label", "SI01_label", "FL01_label", "MR01_label", "BP01_label",
] as const;
export type SlotValues = Partial<Record<(typeof SLOTS)[number], string>>;

const SLOT_NAMES = new Set<string>(SLOTS);
const NOTE_KINDS: Record<string, NoteKind> = { ok: "strength", warn: "watch", mile: "milestone" };

/** Throws on an unknown slot; null when a known slot has no value (piece is skipped). */
export function fillSlots(text: string, slots: SlotValues): string | null {
  let missing = false;
  const filled = text.replace(/\{([^{}]+)\}/g, (_, name: string) => {
    if (!SLOT_NAMES.has(name)) throw new Error(`Unknown slot {${name}}`);
    const value = slots[name as keyof SlotValues];
    if (value === undefined || value === "") missing = true;
    return value ?? "";
  });
  return missing ? null : filled;
}

type Ready = { piece: ContentPiece; heading: string | null; body: string };

const parsed = new Map<string, Trigger | Error>();
function triggerOf(piece: ContentPiece) {
  const key = piece.trigger_expr;
  if (!parsed.has(key)) {
    try {
      parsed.set(key, parseTrigger(key));
    } catch (error) {
      parsed.set(key, error as Error);
    }
  }
  return parsed.get(key)!;
}

/**
 * Active pieces whose trigger holds, slots filled, highest priority first.
 * A piece with a bad trigger or slot is logged and skipped — one broken row
 * must not take the whole result page down.
 */
function matching(pieces: ContentPiece[], facts: Facts, slots: SlotValues, onError: (msg: string) => void) {
  const ready: Ready[] = [];
  for (const piece of pieces) {
    if (!piece.active) continue;
    const trigger = triggerOf(piece);
    if (trigger instanceof Error) {
      onError(`content_piece ${piece.id}: ${trigger.message}`);
      continue;
    }
    if (!evaluate(trigger, facts)) continue;
    try {
      const body = fillSlots(piece.body, slots);
      const heading = piece.heading ? fillSlots(piece.heading, slots) : null;
      if (body === null || (piece.heading && heading === null)) continue;
      ready.push({ piece, heading, body });
    } catch (error) {
      onError(`content_piece ${piece.id}: ${(error as Error).message}`);
    }
  }
  return ready.sort((a, b) => b.piece.priority - a.piece.priority || a.piece.id.localeCompare(b.piece.id));
}

const has = (prefix: string) => (r: Ready) => r.piece.id.startsWith(prefix);
const is = (id: string) => (r: Ready) => r.piece.id === id;
const note = (r: Ready): Note => ({ kind: NOTE_KINDS[r.piece.note_type ?? ""] ?? "strength", text: r.body });
const item = (r: Ready): Item => ({ heading: r.heading!, body: r.body });

/**
 * Selection rules per section (§1.5). Within a section a piece's role comes
 * from its id: SN-OPENER, PS-<pillar>, LADDER-INTRO / LADDER-<n> /
 * LADDER-CLOSE-*, CT-INTRO / CT-RANGE / CT-W-* / CT-RANK-*, CDN-FALLBACK,
 * UPGRADE-HEADING. A section that selects nothing is null or empty, and the
 * page omits it entirely.
 */
export function selectContent(
  pieces: ContentPiece[],
  facts: Facts,
  slots: SlotValues,
  onError: (msg: string) => void = console.error,
): ReportContent {
  const all = matching(pieces, facts, slots, onError);
  const section = (key: string) => all.filter((r) => r.piece.section === key);

  // Exactly two: the opener plus one band-keyed closer.
  const sn = section("SCORE_NOTE");
  const scoreNote = [sn.find(is("SN-OPENER")), sn.find((r) => !is("SN-OPENER")(r))]
    .filter((r): r is Ready => !!r)
    .map((r) => r.body);

  const gateReason = section("GATE_REASON")[0]?.body ?? null;

  const toldUs = section("WHAT_YOU_TOLD_US").map((r) => r.body);

  const noticed = section("WHAT_WE_NOTICED")
    .filter((r) => r.heading)
    .slice(0, 4)
    .map(item);

  const subtitles: Record<string, string> = {};
  for (const r of section("PILLAR_SUBTITLE")) {
    const code = /^PS-([A-Z]+)$/.exec(r.piece.id)?.[1];
    if (code && !subtitles[code]) subtitles[code] = r.body;
  }

  const importantPoints = section("IMPORTANT_POINTS").slice(0, 6).map(note);

  // Never capped, never omitted.
  const legal = section("LEGAL_CHECK").map(note);

  const nutshell = section("IN_A_NUTSHELL")
    .slice(0, 5)
    .map((r) => r.body);

  // Exactly one from each group, in this order.
  const ct = section("CANNOT_TELL");
  const ctItems = [ct.find(is("CT-RANGE")), ct.find(has("CT-W-")), ct.find(has("CT-RANK-"))]
    .filter((r): r is Ready => !!r?.heading)
    .map(item);
  const cannotTell = ctItems.length
    ? { intro: ct.find(is("CT-INTRO"))?.body ?? null, items: ctItems }
    : null;

  const ladderPieces = section("LADDER");
  const bodies: Record<string, string> = {};
  for (const r of ladderPieces) {
    const band = /^LADDER-(\d)$/.exec(r.piece.id)?.[1];
    if (band) bodies[`B${band}`] = r.body;
  }
  const ladder = {
    intro: ladderPieces.find(is("LADDER-INTRO"))?.body ?? null,
    bodies,
    close: ladderPieces.find(has("LADDER-CLOSE-"))?.body ?? null,
  };

  // Up to three actions; with none, the fallback alone and the lead suppressed (§8c).
  const cdnActions = section("CAN_DO_NOW_ACTION");
  const actions = cdnActions
    .filter((r) => !is("CDN-FALLBACK")(r) && r.heading)
    .slice(0, 3)
    .map(item);
  const lead = actions.length ? (section("CAN_DO_NOW_LEAD")[0]?.body ?? null) : null;
  const fallback = actions.length ? null : (cdnActions.find(is("CDN-FALLBACK"))?.body ?? null);
  const canDoNow = lead || actions.length || fallback ? { lead, actions, fallback } : null;

  const up = section("UPGRADE");
  const block = up.find((r) => !is("UPGRADE-HEADING")(r));
  const upgrade = block
    ? { heading: up.find(is("UPGRADE-HEADING"))?.body ?? null, title: block.heading, body: block.body }
    : null;

  return {
    scoreNote, gateReason, toldUs, noticed, subtitles, importantPoints, legal,
    nutshell, cannotTell, ladder, canDoNow, upgrade,
  };
}
