/**
 * Content Library — every user-facing string on the Tier 1 result is selected
 * from here by band, pillar, status or trigger. Nothing is composed at runtime
 * beyond inserting the founder's own details (spec §11).
 *
 * Keys follow the library codes (A2-*, A3-*, A4-B*, A5-*). Status of each group:
 *   A2  Pillar subtitles .......... from the approved designs
 *   A3  Weakest-pillar lines ...... DRAFT — replace with library text
 *   A4  Verdict paragraphs ........ DRAFT — replace with library text
 *   A5  Legal check ............... DRAFT — replace with library text
 *   TOLD  "What you told us" ...... from the approved designs, one line per option
 *   LADDER  Readiness ladder ...... from the approved designs
 *   NOW  "What you can do now" .... DRAFT (rule R6: gate items only, else fallback)
 *
 * Not in the library yet, so the result page leaves these sections out:
 * "What we noticed", "Important points to note", "In a nutshell",
 * "What this test cannot tell you".
 */

/** A2 — pillar subtitles. */
export const PILLAR_SUBTITLES: Record<string, string> = {
  UE: "Will a franchise owner make money?",
  OR: "Can someone else run it like you do?",
  SI: "Can you help an owner after they join?",
  FL: "Does the business run without you?",
  MR: "Does it work outside your home city?",
  BP: "Do people come asking for your franchise?",
  PP: "Do you know who should run your next outlet?",
};

/** A3 — weakest-pillar line. DRAFT. */
export const WEAKEST_LINES: Record<string, string> = {
  UE: "The numbers are the first thing a franchise owner checks. Until one outlet clearly earns back its cost, a partner is buying a risk rather than a business.",
  OR: "Too much of how the business runs still lives in people’s heads. A franchise owner can only copy what is written down.",
  SI: "There is not yet a programme to train a new owner and their staff. The first 90 days are when a franchise owner needs that most.",
  FL: "Decisions still come back to you. A franchise owner cannot call you every day, so the business has to run on rules you have written down.",
  MR: "Every sale so far comes from one city. There is no proof yet that the model works where people don’t already know you.",
  BP: "Few people are asking to open your brand. You will need to go out and find partners, rather than wait for them.",
  PP: "You have not yet defined who should run your next outlet. Without that, the first partner is chosen by whoever asks first.",
};

/** A4 — verdict paragraph, selected by the band containing the overall score (after gates). DRAFT. */
export const VERDICTS: Record<string, string> = {
  B1: "The business works, but franchising now would put a partner at risk. The foundations need to be in place before anyone else invests in them.",
  B2: "You have a working business with real customers, but the foundations are not yet load-bearing. There is groundwork to finish before a partner joins.",
  B3: "You are close. The business can be franchised, with a few conditions to settle before the first partner joins.",
  B4: "You have strong foundations. The questions now are about the model — fee, territory and partner selection — not whether to franchise.",
  B5: "You are ready to scale. Your numbers, systems and support are in place; the main risk now is growing faster than your support can follow.",
};

/** A5 — legal check. DRAFT. */
export const LEGAL = {
  CLEAN: {
    kind: "strength",
    text: "**Your legal position is clean.** Your trademark is registered or filed, and there are no active disputes.",
  },
  TRADEMARK: {
    kind: "watch",
    text: "**No trademark filed.** Your level is held at Early Stage until a trademark application is filed. Someone else could register your brand name first.",
  },
  DISPUTE: {
    kind: "watch",
    text: "**An active legal dispute.** Your level is held at Not Yet Ready until it is resolved. A partner cannot safely invest while ownership is in question.",
  },
} as const;

/** Short gate reason under the level badge (spec §7: the reason is named). DRAFT. */
export const GATE_REASONS = {
  noTrademark: "Held at Early Stage until a trademark application is filed.",
  dispute: "Held at Not Yet Ready while a legal dispute is active.",
};

/** LADDER — description of each band. */
export const LADDER: Record<string, string> = {
  B5: "Proven numbers, documented systems and the ability to support partners. The main risk is growing faster than support can follow.",
  B4: "Strong foundations. The questions now are model, fee, territory and partner selection — not whether to franchise.",
  B3: "Franchisable, but with conditions to settle before partners join. Skipping them is usually paid for by the first franchise owner.",
  B2: "A working business with real customers. What is missing is the documentation, systems or support capacity someone else would need.",
  B1: "The business works, but it depends on the founder and is not yet written down. Franchising now would put a partner at risk.",
};

/** NOW — "What you can do now": gate items only (rule R6). DRAFT. */
export const DO_NOW = {
  noTrademark: {
    title: "File a trademark application.",
    body: "It is short and low-cost, and it lifts the hold on your level. Until it is filed, someone else could register your brand name first.",
  },
  dispute: {
    title: "Resolve the active legal dispute.",
    body: "No partner can safely invest while ownership of the brand is in question. This comes before everything else.",
  },
  fallback: "You are ready to move to the next stage.",
};

/** TOLD — "What you told us", one line per answered option. */
export const TOLD = {
  procedures: { Yes: "**written down**", Partially: "**partly written down**", No: "**not yet written down**" },
  sopShare: {
    None: "**no**",
    "A few": "**a few**",
    "About half": "**about half** of your",
    Most: "**most**",
    All: "**all**",
  },
  partner: {
    Yes: "You know **what kind of franchise partner** you want",
    Partially: "You have **a partial picture** of the franchise partner you want",
    No: "You have **not yet defined** the franchise partner you want",
  },
  training: {
    Yes: "A training programme for new franchise owners is **in place**",
    Partially: "A training programme for new franchise owners is **partly built**",
    No: "There is **no training programme** for new franchise owners yet",
  },
  /** FL01, in option order. */
  authority: [
    "**Most daily decisions** still come to you",
    "Your team handles routine work, but **decisions still come to you**",
    "A manager runs the day to day **within limits you have set**",
    "Managers **decide on their own**, and you review the outcomes",
    "The business **runs without you** day to day",
  ],
  cities: { "1": "**one city**", "2–3": "**2 to 3 cities**", "4 or more": "**4 or more cities**" },
} as const;
