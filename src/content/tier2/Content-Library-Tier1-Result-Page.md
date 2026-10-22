# Content Library — Tier 1 Result Page

**Version 1.7 · 8 October 2026**
- v1.1 — outlet triggers switched from integer to band
- v1.2 — `weak_count == 0` variant added, `{year_opened}` slot removed, Legal Check moved into the table
- v1.3 — three-band ranges handled, legal findings de-duplicated, Can Do Now split into lead and action, What You Told Us added, piece counts corrected
- v1.4 — selection table completed, `!= NULL` removed from the grammar, restatement labels corrected, Group A placed, score-box sentence added as pieces, capped-verdict rule resolved
- v1.5 — A2 subtitles settled on the approved wording, A4 retired from Tier 1, `GATE_REASON` defined, section keys and slots completed, config-version rule for restatements
- v1.6 — FAQ naming corrected to P5, "4 minutes" everywhere, Zoho interest field specified, stale validation table marked
- v1.7 — pricing consolidated into one authoritative block, old FAQ item rewritten, phone number moved to the interest step

**Status:** closes the gap named in Scoring Specification §11 and §14 item 4.

Seven sections had no library entries. This document supplies them. Every string here is derived from the six Tier 1 reports written by hand for Triloma, Career Craft, Strings, QB365, da' mushroom and 3 Circle.

**Nothing in this document is written at runtime.** Each piece is a stored string with a condition. The engine evaluates conditions, selects pieces, fills slots, and renders. Spec §11.

**Ronak owns the wording.** These are drafts in the agreed voice, ready to seed so the launch is not blocked. Every one is editable in the table afterwards without a deployment — which is the entire point of putting them there.

---

# 1. How this works

## 1.1 Table shape

```sql
CREATE TABLE content_piece (
  id           VARCHAR(64)  PRIMARY KEY,   -- stable, human-readable
  section      VARCHAR(32)  NOT NULL,      -- see section keys below
  note_type    VARCHAR(8)   NULL,          -- ok | warn | mile | null
  priority     INT          NOT NULL,      -- higher fires first
  trigger_expr TEXT         NOT NULL,      -- 'ALWAYS' or an expression
  heading      TEXT         NULL,
  body         TEXT         NOT NULL,
  active       BOOLEAN      NOT NULL DEFAULT TRUE
);
```

Section keys: `SCORE_NOTE` · `GATE_REASON` · `WHAT_YOU_TOLD_US` · `WHAT_WE_NOTICED` · `PILLAR_SUBTITLE` · `IMPORTANT_POINTS` · `LEGAL_CHECK` · `IN_A_NUTSHELL` · `CANNOT_TELL` · `LADDER` · `CAN_DO_NOW_LEAD` · `CAN_DO_NOW_ACTION` · `UPGRADE`

## 1.2 Trigger grammar

Deliberately small. No functions, no nesting beyond `AND` / `OR`.

```
<expr>  := ALWAYS | <cond> [ (AND|OR) <cond> ]*
<cond>  := <field> <op> <value>
<op>    := == | != | >= | <= | IN
```

**Fields available:**

| Group | Fields |
|---|---|
| Answers (stored 1–5, or NULL) | `UE01` `UE02` `OR01` `OR02` `BP01` `MR01` `PP01` `SI01` `FL01` |
| Gates (stored label) | `G1` `G3` |
| Profile | `outlets_band` `category` `city` |
| Computed | `band` `band_count` `low` `high` `UE` `OR` `SI` `FL` `MR` `BP` `PP` `weakest_pillar` `weak_count` |

**A NULL answer makes every condition referencing it false.** Never true, never an error. This is the same null discipline as the scoring engine — a skipped question must not accidentally satisfy a trigger.

**There is no NULL literal in the grammar**, so `UE01 != NULL` is not a valid condition. To mean "this question was answered", write `UE01 >= 1`, which is false for a null by the rule above. All eleven Tier 1 questions are required, so nothing is null there in practice — the form matters only if a question later becomes optional.

## 1.3 Slots

`{brand}` `{city}` `{low}` `{high}` `{band}` `{weakest_area}` `{weak_count}` `{weak_list}`

**Restatement slots**, each the `restatement` value of the option the brand chose:
`{outlets_label}` `{UE01_label}` `{UE02_label}` `{OR01_label}` `{OR02_label}` `{PP01_label}` `{SI01_label}` `{FL01_label}` `{MR01_label}` `{BP01_label}`

**Restatements are read from the *active* scoring config, not the version the submission was scored under.** Scores must reproduce exactly from the saved version — that is what versioning is for — but display wording should improve for everyone, including past reports. Splitting it this way means an old submission keeps its score and gains the better phrasing.

**There is no `{outlets}` slot.** Outlet count is captured as a band, not a number, so no piece may print it into a sentence.

**`{overall}` does not exist and must never be added.** Spec §4 — the point score never leaves the server. If a slot for it appears in this table, the range becomes decoration.

## 1.4 Outlet count is a band, not a number

Tier 1 captures outlet count as a choice, not a typed number. Store the chosen band as `outlets_band`:

| Stored value | Choice shown |
|---|---|
| `ONE` | 1 |
| `TWO_TO_FIVE` | 2 to 5 |
| `SIX_TO_FIFTEEN` | 6 to 15 |
| `SIXTEEN_PLUS` | 16 or more |

**Never convert a band to a number.** Taking the lowest value of a range understates systematically — a five-outlet brand treated as two gets told it protected its brand "before it needed to", which is false.

**Every trigger in this library reduces to one distinction: `ONE` or not `ONE`.** Nothing needs finer resolution, so the band is sufficient as captured. If a future piece needs to separate three outlets from twelve, that is the point at which to ask for an exact number — not before.

**The exact number should be asked at Tier 2**, where it is needed for the economics and where a paying customer will not object to one more question. Confirm the band labels above match what the live form actually shows.

## 1.5 Selection rules

| Section | Rule |
|---|---|
| `SCORE_NOTE` | Exactly 2 — the fixed opener plus one band-keyed closer |
| `WHAT_YOU_TOLD_US` | **All matching**, in priority order. Never capped |
| `WHAT_WE_NOTICED` | All matching, by priority, **capped at 4** |
| `IMPORTANT_POINTS` | All matching, by priority, **capped at 6** (Open Item O5) |
| `LEGAL_CHECK` | **All matching.** Never capped, never omitted |
| `IN_A_NUTSHELL` | All matching, by priority, **capped at 5** |
| `CANNOT_TELL` | Exactly 3 — one from each group in §7 |
| `LADDER` | All 5 rungs, always, in fixed order, plus intro and one closing line |
| `CAN_DO_NOW_LEAD` | **Exactly one** — highest matching priority. Suppressed when the action fallback fires |
| `CAN_DO_NOW_ACTION` | All matching, by priority, **capped at 3**. If none match, the fallback alone |
| `UPGRADE` | Always, one piece |
| `GATE_REASON` | At most one, under the badge. Nothing when no gate fires |
| `PILLAR_SUBTITLE` | One per pillar, all seven |

**If a section selects nothing, omit the section entirely — heading and all — and let the page reflow.** Never render an empty heading. Never render placeholder text. This applies to the web result page and the PDF identically.

---

# 2. LADDER — 5 rungs plus 4 framing lines

No triggers. Identical for every brand, because the ladder describes the standard, not the business. Rendered top to bottom in this order, with the brand's own band(s) highlighted.

| id | priority | body |
|---|---|---|
| `LADDER-5` | 50 | Proven numbers, documented systems and the ability to support partners. The main risk is growing faster than support can follow. |
| `LADDER-4` | 40 | Strong foundations. The questions now are model, fee, territory and partner selection — not whether to franchise. |
| `LADDER-3` | 30 | Franchisable, but with conditions to settle before partners join. Skipping them is usually paid for by the first franchise owner. |
| `LADDER-2` | 20 | A working business with real customers. What is missing is the documentation, systems or support capacity someone else would need. |
| `LADDER-1` | 10 | The business works, but it depends on the founder and is not yet written down. Franchising now would put a partner at risk. |

**Intro line** (`LADDER-INTRO`, always): *This is not a ranking against other brands. It is the standard every business is measured against, and it shows what a brand at each level typically looks like.*

**Closing line** — three variants:

| id | trigger | body |
|---|---|---|
| `LADDER-CLOSE-ONE` | `band_count == 1` | Your score range of {low} to {high} sits inside a single level. |
| `LADDER-CLOSE-SPAN` | `band_count == 2` | Your score range of {low} to {high} covers these two levels. |
| `LADDER-CLOSE-THREE` | `band_count == 3` | Your score range of {low} to {high} is wide enough to touch three levels. Eleven questions cannot narrow it further — that is what the full report is for. |

**`band_count` is the number of distinct bands the displayed range touches**, computed from `low` and `high` after clamping to 0–100. Three is reachable: **13,773 of the 253,125 possible answer sets — 5.4%, roughly one brand in eighteen.** It happens because the Almost Ready band is 15 points wide while the range is up to 17.

**The badge names the outer two bands only**, highest first — *"Ready to Plan – Early Stage"*, never all three. The ends define the span exactly as well as listing every level inside it, and the ladder already highlights each one. Three names in an orange badge reads as indecision rather than precision.

---

# 3. UPGRADE — 1 piece, fixed

`UPGRADE-TIER2`, trigger `ALWAYS`.

> **The Franchise Readiness Report**
>
> About thirty more questions, roughly 15 minutes. Your earlier answers carry over — no question is asked twice.
>
> - **Your exact score** — one number, not a range
> - **All 7 areas explained in writing** — what is working, what is not, and why it matters for franchising
> - **Your problems ranked** — so you know which area to work on first
> - **Your full legal and approvals check**
> - **Where you stand** compared with similar brands we have worked with
>
> **₹1,999 + 18% GST** · ₹2,359 payable
> You will receive your report within 24 hours.

Heading above the block (`UPGRADE-HEADING`): *If You Want to Know Exactly Where You Stand*

**Two notes.** The question count is deliberately "about thirty" rather than a fixed number, because the Tier 2 set varies by outlet count and category — a hard number would be wrong for some brands. And the last bullet is the one Section 08 of a Tier 2 report cannot always honour for categories outside F&B, fashion and retail (Decision B4). Soften it or let Ronak write category patterns; flagged, not resolved.

---

# 4. IMPORTANT_POINTS — 38 pieces

One per answer value. Mechanical, high volume, low risk. The engine fires every match and shows the top six by priority.

Priority encodes "how much this matters to a franchise decision", not how good or bad it is. A serious problem and a serious strength both rank high.

## Unit economics

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `IP-UE01-5` | `UE01 == 5` | ok | 85 | Your outlet pays back in under 12 months. That is the first number a franchise investor looks at, and yours is strong. |
| `IP-UE01-4` | `UE01 == 4` | ok | 70 | Your outlet earns back its cost in 12 to 18 months. That is a workable base to build a franchise offer on. |
| `IP-UE01-3` | `UE01 == 3` | warn | 75 | An 18 to 24 month payback sits at the longer end of what investors compare against. |
| `IP-UE01-2` | `UE01 == 2` | warn | 88 | A 24 to 36 month payback is longer than most franchise investors accept without a strong reason. |
| `IP-UE01-1` | `UE01 == 1` | warn | 95 | A payback beyond 36 months is very hard to put in front of an investor, whatever the rest of the business looks like. |
| `IP-UE02-5` | `UE02 == 5` | ok | 80 | An outlet margin above 25% leaves comfortable room for both you and a franchise owner to earn. |
| `IP-UE02-4` | `UE02 == 4` | ok | 70 | A 20 to 25% outlet margin leaves room for a fee and a royalty without squeezing the owner. |
| `IP-UE02-3` | `UE02 == 3` | ok | 60 | A 15 to 20% outlet margin is workable. The full report checks whether it stays workable once a franchise owner pays a fee and a royalty on top. |
| `IP-UE02-2` | `UE02 == 2` | warn | 85 | A 10 to 15% margin is thin once a royalty comes out of it. This is the number most likely to set your ceiling. |
| `IP-UE02-1` | `UE02 == 1` | warn | 95 | Below 10%, there is not enough margin for a franchise owner to earn after paying you. |

## Systems

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `IP-OR01-5` | `OR01 == 5` | ok | 90 | Your operating procedures are written down. This is the single most useful thing you can have built at this stage. |
| `IP-OR01-3` | `OR01 == 3` | mile | 72 | Your procedures are partly written down. Finishing them is mostly recording what you and your team already do. |
| `IP-OR01-1` | `OR01 == 1` | warn | 92 | Your procedures are not written down. A franchise owner in another city cannot learn by working alongside you. |
| `IP-OR02-5` | `OR02 == 5` | ok | 82 | Every core workflow has an SOP a new manager could follow. Few businesses at your stage can say that. |
| `IP-OR02-4` | `OR02 == 4` | ok | 74 | Most core workflows have an SOP a new manager could follow unassisted. |
| `IP-OR02-3` | `OR02 == 3` | mile | 68 | About half your workflows have an SOP. The half that does not is usually the half that needs judgement. |
| `IP-OR02-2` | `OR02 == 2` | warn | 84 | Only a few workflows have a written SOP. Most of how this business runs still lives with people rather than on paper. |
| `IP-OR02-1` | `OR02 == 1` | warn | 90 | No workflow has a written SOP yet. Everything a franchise owner would need to know is currently held by your team. |

## Brand pull

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `IP-BP01-5` | `BP01 == 5` | ok | 78 | More than 40 franchise enquiries last year. Demand for the franchise itself is already proven. |
| `IP-BP01-4` | `BP01 == 4` | ok | 70 | 16 to 40 franchise enquiries last year. There is real inbound interest to work with. |
| `IP-BP01-3` | `BP01 == 3` | ok | 58 | 6 to 15 franchise enquiries last year. There is genuine interest, and it is still early. |
| `IP-BP01-2` | `BP01 == 2` | warn | 55 | 1 to 5 franchise enquiries last year. Demand for the franchise itself is still early, even where demand from customers clearly is not. |
| `IP-BP01-1` | `BP01 == 1` | warn | 62 | No franchise enquiries last year. Nothing is pulling investors toward you yet, so partners will have to be found rather than answered. |

## Market proof

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `IP-MR01-5` | `MR01 == 5` | ok | 86 | The model has worked in four or more cities. That removes the biggest question a franchise investor has. |
| `IP-MR01-3` | `MR01 == 3` | ok | 72 | The model has worked in two or three cities. It has already travelled beyond its home ground. |
| `IP-MR01-1` | `MR01 == 1` | mile | 76 | The model is proven in one city. Showing it works in a second is the step that changes the conversation with every investor. |

## Right partner

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `IP-PP01-5` | `PP01 == 5` | ok | 66 | You already know what kind of partner you are looking for. Many brands reach their first franchise conversation without this. |
| `IP-PP01-3` | `PP01 == 3` | mile | 60 | You have a rough idea of the right partner. Writing it down is what makes it usable when someone persuasive calls. |
| `IP-PP01-1` | `PP01 == 1` | warn | 80 | You have not defined who the right partner is. Partner choice is the one franchise decision that cannot be undone afterwards. |

## Support

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `IP-SI01-5` | `SI01 == 5` | ok | 76 | A structured training programme already exists. A franchise owner leans on training hardest in their first 90 days. |
| `IP-SI01-3` | `SI01 == 3` | mile | 70 | Your training programme is partly built. Completing it is mostly writing down what you and your team already do. |
| `IP-SI01-1` | `SI01 == 1` | warn | 86 | There is no training programme yet. This is what a franchise fee is nominally paid for, and the first question a serious investor asks. |

## Your role

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `IP-FL01-5` | `FL01 == 5` | ok | 84 | The business operates without you in daily decisions. That is the position from which a founder can genuinely support partners. |
| `IP-FL01-4` | `FL01 == 4` | ok | 74 | Your managers make operational decisions independently and you review outcomes rather than approving in advance. |
| `IP-FL01-3` | `FL01 == 3` | ok | 64 | A manager already runs the day to day within limits you set. You are not the bottleneck you could have been. |
| `IP-FL01-2` | `FL01 == 2` | warn | 82 | Your team handles routine tasks, but decisions still come to you. Franchise support would land on top of that load. |
| `IP-FL01-1` | `FL01 == 1` | warn | 94 | Most daily decisions still come to you. A franchise network multiplies demands on the person who is already the constraint. |

## Stage

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `IP-OUTLETS-1` | `outlets_band == 'ONE'` | mile | 78 | A second outlet you run yourself is what proves the model repeats. It is the next step in the journey, not a gap in the business. |

---

# 4b. LEGAL_CHECK — 5 pieces

Content Library Group A already holds this copy as `A5-CLEAN`, `A5-TRADEMARK` and `A5-DISPUTE`. **It belongs in `content_piece` like everything else, not in `content.ts`.** The rows below are the shortened versions used in the approved sample — plainer English than the Group A originals, same meaning.

Section key `LEGAL_CHECK`. Rendered as note cards, same component as Important Points.

| id | trigger | type | pri | body |
|---|---|---|---|---|
| `LG-TM-FILED` | `G1 == 'Application filed'` | ok | 90 | **Trademark application filed.** Your brand name is being protected — and you did this before you needed to. |
| `LG-TM-REG` | `G1 == 'Registered'` | ok | 92 | **Trademark registered.** You own the name you would be licensing. That is the cleanest position to franchise from. |
| `LG-TM-NONE` | `G1 == 'Neither'` | warn | 99 | **No trademark registered or filed.** Franchising means licensing your brand to someone else, and you cannot license what you do not own. This caps your result until an application is filed. |
| `LG-NO-DISPUTE` | `G3 == 'No'` | ok | 80 | **No legal disputes.** The most common blocker to franchising is not there. |
| `LG-DISPUTE` | `G3 == 'Yes'` | warn | 100 | **An unresolved dispute over brand ownership, IP or a franchisee.** A franchise agreement grants rights the brand has to be able to defend. This has to be settled first, whatever the rest of this report says. |

All matching pieces show — never capped, never omitted. Two always fire, one per gate.

---

# 4c. WHAT_YOU_TOLD_US — 8 pieces

A plain restatement of the brand's own answers, before any interpretation. Not an observation — it lets the reader check we heard them correctly before reading what we made of it.

**One template per question, not per answer value.** The chosen option's own *restatement* is slotted in, so eight templates cover all thirty-seven answers.

| id | trigger | pri | body |
|---|---|---|---|
| `TU-PROFILE` | `ALWAYS` | 100 | You operate **{outlets_label}**, in **{city}** |
| `TU-UE` | `UE01 >= 1` | 90 | Your outlet earns back its cost in **{UE01_label}**, at a margin of **{UE02_label}** |
| `TU-OR` | `OR01 >= 1` | 85 | Your operating procedures are **{OR01_label}**, and **{OR02_label}** core workflows have an SOP a new manager could follow |
| `TU-PP` | `PP01 >= 1` | 70 | You **{PP01_label}** what kind of franchise partner you want |
| `TU-SI` | `SI01 >= 1` | 65 | A training programme for new franchise owners is **{SI01_label}** |
| `TU-FL` | `FL01 >= 1` | 60 | **{FL01_label}** |
| `TU-MR` | `MR01 >= 1` | 55 | The model has been tested in **{MR01_label}** |
| `TU-BP` | `BP01 >= 1` | 50 | **{BP01_label}** asked you about a franchise last year |

## Restatements, not display labels

Each option needs a second form for use inside a sentence. **Add a `restatement` key to each option in `fra_scoring_config`**, in a new config version — still data, still no deployment to edit. (My earlier wording said "a column on the option register"; the register is config JSON, so a key is right.)

**Most of these already exist** in the approved designs and in the build's current `content.ts`, including the five second-person FL01 anchors. This is a move from code into config plus a review by Ronak, not forty phrases written from scratch.

The four that were wrong in v1.3, corrected above and here:

| Slot | Must render as | Not |
|---|---|---|
| `{outlets_label}` | "one outlet" · "2–5 outlets" · "6–15 outlets" · "16+ outlets" | "1" · "2–5" |
| `{OR02_label}` | "most" · "about half" · "a few" — template now reads "{OR02_label} core workflows" | "most of core workflows" |
| `{MR01_label}` | "one city" · "two or three cities" · "four or more cities" | "1" |
| `{PP01_label}` | "know" · "partly know" · "have not yet decided" — template now reads "You {PP01_label} what kind…" | "You Yes know…" |

---

# 4d. SCORE_NOTE, GATE_REASON and PILLAR_SUBTITLE

`Content-Library-Group-A.md` holds the originals. Section keys and triggers were never defined; here they are, with two pieces retired.

## `SCORE_NOTE` — 6 pieces, two shown

The score-box sentence, previously hardcoded. A fixed opener plus a band-keyed closer.

| id | trigger | pri | body |
|---|---|---|---|
| `SN-OPENER` | `ALWAYS` | 100 | This is a range, not one number. Eleven questions can tell us roughly where you stand, but not exactly. |
| `SN-B1` | `band == 'NOT_YET_READY'` | 50 | The full report shows which gaps are structural and which are simply undone. |
| `SN-B2` | `band == 'EARLY_STAGE'` | 50 | You have a working business. The full report shows what still has to be built around it. |
| `SN-B3` | `band == 'ALMOST_READY'` | 50 | You have built more structure than most businesses at your stage, and the full report tells you exactly where that places you. |
| `SN-B4` | `band == 'READY_TO_PLAN'` | 50 | Your foundations hold. The full report tells you which decisions to make before partners join. |
| `SN-B5` | `band == 'READY_TO_SCALE'` | 50 | This is a strong result. The full report confirms it pillar by pillar and shows where scale would strain first. |

`band` is the band on the badge — the capped band when a gate fires.

## A4 is not rendered at Tier 1

**You were right that `A4` and `SCORE_NOTE` collide, and that three blocks saying "you are close" is two too many.** The approved score box carries `SN-OPENER` plus one sentence, and nothing else. `A4-B1` … `A4-B5` predate that layout, and "What We Noticed" has since taken over the interpretive job.

**Mark A4 inactive.** It stays in the library but renders nowhere at Tier 1. That also makes its stale numbers moot — "ten questions", "forty-four", and the old integer band headings. Nothing to correct in copy that nothing shows.

Scoring Specification §8 now names `SCORE_NOTE` as the piece it governs.

## `GATE_REASON` — 2 pieces, at most one shown

Under the badge. **The first line of the A5 copy only** — you were right that three paragraphs there would restate the finding (`LG-TM-NONE`) and the action (`CDN-FILE-TM`), which is exactly the repetition v1.3 removed.

| id | trigger | pri | body |
|---|---|---|---|
| `GR-DISPUTE` | `G3 == 'Yes'` | 100 | **This result is capped by an unresolved legal matter.** |
| `GR-TRADEMARK` | `G1 == 'Neither'` | 90 | **One item is capping your band: your brand name is not yet trademarked.** |

Nothing renders when no gate fires. `A5-CLEAN` is retired — a clean result has no gate and needs no explanation under the badge; the `LG-*` cards in §4b carry the reassurance where it belongs.

**A5's trigger wording is wrong in Group A** — it says `G1 = No`, but the option is `Neither`. The triggers above are correct.

## `PILLAR_SUBTITLE` — 7 pieces, all shown

**Seed the approved sample's wording, not Group A's A2.** You were right on both counts: A2 predates the plain-English rewrite (R2), and its lines are too long for a table column.

| Pillar | Subtitle |
|---|---|
| Profit & Payback | Will a franchise owner make money? |
| Systems | Can someone else run it like you do? |
| Support | Can you help an owner after they join? |
| Your Role | Does the business run without you? |
| Market Proof | Does it work outside your home city? |
| Brand Pull | Do people come asking for your franchise? |
| Right Partner | Do you know who should run your next outlet? |

Trigger `ALWAYS`, one per pillar, no score or band logic. **This also settles Scoring Specification §14 items 1 and 2** — plain names everywhere, on every customer-facing surface.

## A1 stays in the scoring config

`A1-1` … `A1-5` are the FL01 answer options and the engine matches on them. They stay in `fra_scoring_config`, with the second-person forms as their `restatement` values, used by `TU-FL`. **The live form's question text matches Specification §2 and is correct**; Group A's older phrasing is the stale one.

## A3 is not shown at Tier 1

The weakest-pillar one-liners have no place in the approved layout. Keep them in the library inactive — Ronak may want them at Tier 2, where the ranked gap list gives a weakest-pillar line something to lead.

---

# 5. WHAT_WE_NOTICED — 13 pieces

The hard section: each piece reads several answers at once and says something the founder could not have read off their own score. Heading plus one short paragraph. Capped at 4.

| id | trigger | pri |
|---|---|---|
| `WN-STRUCTURE-FIRST` | `OR01 == 5 AND OR02 >= 4 AND outlets_band == 'ONE'` | 95 |
| **You have built the structure before the scale.** |||
| Written procedures and SOPs for most of what you do, at one outlet. Most businesses do this the other way round: they grow first and document later, then spend a year fixing it. You are in the rarer, easier position. |||
| `WN-SCALE-FIRST` | `outlets_band != 'ONE' AND OR01 != 5` | 94 |
| **You have grown faster than you have written things down.** |||
| More than one outlet, running on knowledge your team carries rather than on paper. That works while you can reach everyone. A franchise owner in another city cannot be reached the same way, and what is undocumented becomes their own invention. |||
| `WN-SECOND-OUTLET` | `outlets_band == 'ONE'` | 90 |
| **Your next milestone is a second outlet you run yourself.** |||
| A franchise investor is buying proof that the model works more than once. A second location under your own management is the shortest way to show it. |||
| `WN-NUMBERS-STRONG` | `UE01 == 5 AND UE02 >= 4` | 81 |
| **Your numbers are the strongest part of your offer.** |||
| A payback under twelve months on a healthy margin is the combination investors look for first, and it is the part of this report you will not have to explain to anybody. |||
| `WN-NUMBERS-STEADY` | `UE01 == 4 AND UE02 IN (3,4)` | 80 |
| **Your numbers are steady rather than stretched.** |||
| The payback and margin you reported make a workable base. The question the full report answers is whether they stay workable once a franchise owner pays a fee and a royalty on top. |||
| `WN-MARGIN-CEILING` | `UE02 <= 2` | 88 |
| **Your margin is what will set your ceiling.** |||
| Everything else can be fixed with work. A thin margin cannot, because a franchise owner has to earn a living from what is left after they pay you. This is the number to look at before anything else on this page. |||
| `WN-PAYBACK-QUESTIONED` | `UE01 <= 2 AND UE02 >= 3` | 86 |
| **Your margin works. Your payback is the part that will be questioned.** |||
| An investor comparing three opportunities compares payback first. A healthy margin does not rescue a long one — it just means the money comes back slowly rather than not at all. |||
| `WN-WANTED-NOT-TRAVELLED` | `BP01 >= 3 AND MR01 == 1` | 84 |
| **People want this. Nobody has yet shown it travels.** |||
| You have real customer demand and real enquiries. What has not been tested is whether the same thing works somewhere your name means nothing. That is the assumption a franchise owner is being asked to buy. |||
| `WN-PULL-WITHOUT-READINESS` | `BP01 >= 4 AND SI01 <= 3` | 92 |
| **Investors are already calling, and you are not yet set up to answer them.** |||
| Inbound interest is the hardest thing to manufacture and you have it. The risk now is the opposite of the usual one: signing a partner before there is anything to hand them. |||
| `WN-FOUNDER-DEPENDENT` | `FL01 <= 2` | 93 |
| **The business still runs through you.** |||
| This is often what makes a single outlet good, so it is not a criticism. But franchise support is a demand on your time that arrives on top of everything you already carry, and it arrives exactly when a new partner needs you most. |||
| `WN-FOUNDER-FREE` | `FL01 >= 4 AND outlets_band != 'ONE'` | 87 |
| **You have already done the hardest part.** |||
| A business that runs without its founder across more than one location has cleared the thing most brands never clear. Whatever else this report says, that part is behind you. |||
| `WN-NOTHING-TO-SELL` | `SI01 == 1 AND PP01 == 1` | 89 |
| **You have not yet decided what you would be selling.** |||
| No training programme and no defined partner profile. A franchise fee buys support and a place in a system, and at the moment neither has been described. That is a question to settle before a first conversation, not during one. |||
| `WN-READY-TO-STRUCTURE` | `band == 'READY_TO_PLAN' OR band == 'READY_TO_SCALE'` | 82 |
| **The question in front of you is no longer whether to franchise.** |||
| Your foundations hold. What decides the next twelve months is model, fee, territory and who you let in — and those are the decisions that are expensive to get wrong and cheap to get right. |||

---

# 6. IN_A_NUTSHELL — 17 pieces, 5 shown

Short bullets. No headings. Each must stand alone and repeat nothing the reader has already been told twice.

## Group A — where you stand (one always fires)

| id | trigger | pri | body |
|---|---|---|---|
| `NS-BAND-5` | `band == 'READY_TO_SCALE'` | 100 | You are **as ready as brands get** before the first partner signs. |
| `NS-BAND-4` | `band == 'READY_TO_PLAN'` | 100 | Your foundations are **sound** — the open questions are about structure, not readiness. |
| `NS-BAND-3` | `band == 'ALMOST_READY'` | 100 | You are **close**, with specific conditions to settle before partners join. |
| `NS-BAND-2` | `band == 'EARLY_STAGE'` | 100 | You have **a working business** and the franchise scaffolding is not yet built. |
| `NS-BAND-1` | `band == 'NOT_YET_READY'` | 100 | Franchising now would be **early** — and several of the gaps are a year's work, not a decade's. |

## Group B — what is proven

| id | trigger | pri | body |
|---|---|---|---|
| `NS-PROVEN-1CITY` | `MR01 == 1` | 90 | The model is proven **with customers**. It is not yet proven **in a second location**. |
| `NS-PROVEN-MULTI` | `MR01 >= 3` | 90 | The model has already worked **outside its home ground**, which is the question most brands cannot answer. |

## Group C — your strongest asset

| id | trigger | pri | body |
|---|---|---|---|
| `NS-ASSET-SYSTEMS` | `OR >= 80` | 80 | Your **written systems** are your strongest asset, and they make everything ahead of you easier. |
| `NS-ASSET-NUMBERS` | `UE >= 80` | 80 | Your **unit economics** are the strongest part of the offer — the part investors test first. |
| `NS-ASSET-INDEPENDENCE` | `FL >= 80` | 80 | The business **runs without you**, which is the part most founders never finish. |
| `NS-ASSET-PULL` | `BP >= 80` | 78 | **Investors are already asking**, which is the hardest thing on this page to manufacture. |

## Group D — the main unfinished piece

| id | trigger | pri | body |
|---|---|---|---|
| `NS-GAP-TRAINING` | `SI01 <= 3` | 70 | The **training programme** is the main piece still to finish. |
| `NS-GAP-SOPS` | `OR01 <= 3 OR OR02 <= 3` | 70 | **Writing down how the work is done** is the main piece still to finish. |
| `NS-GAP-MARGIN` | `UE02 <= 2` | 74 | The **margin** is the constraint, and it limits what you can charge a partner. |
| `NS-GAP-PARTNER` | `PP01 == 1` | 68 | **Who the right partner is** has not yet been decided, and it is the one choice that cannot be undone. |

## Group E — next milestone

| id | trigger | pri | body |
|---|---|---|---|
| `NS-NEXT-SECOND-OUTLET` | `outlets_band == 'ONE'` | 60 | Your next milestone is **repeating the outlet yourself** — a business decision, not a fix. |
| `NS-NEXT-STRUCTURE` | `outlets_band != 'ONE' AND band IN ('READY_TO_PLAN','READY_TO_SCALE')` | 60 | Your next milestone is **deciding the offer**, not improving the business. |

---

# 7. CANNOT_TELL — 3 items shown, 11 pieces

Fixed intro (`CT-INTRO`, always): *You answered eleven questions. Nine of them carry a score, and your full result is decided by more than forty. Three things these eleven cannot answer:*

*"More than forty" and not "forty": the Report asks thirty-two of its own for a single-outlet brand and up to thirty-five, so the total is 43 to 46. A founder who counts should find the copy understated, never overstated. Corrected 8 October — see §22.3.*

*This wording replaces "This test asked you nine scoring questions", which clashed with the score box's "Eleven questions can tell us roughly where you stand." Both facts are true; stating them separately read as a contradiction.*

## Item 1 — always, template

`CT-RANGE`, trigger `ALWAYS`, priority 100.

> **Are you at {low}, or at {high}?**
> At {low} there is foundational work to finish first. At {high} you are close enough to start structuring the offer. That is a meaningful difference in what you do next year.

## Item 2 — one of seven, keyed to the weakest pillar

| id | trigger | heading | body |
|---|---|---|---|
| `CT-W-UE` | `weakest_pillar == 'UE'` | Do your numbers survive a franchise fee? | Two questions can see your payback and margin. They cannot model what is left for a partner after they pay you. Six can. |
| `CT-W-OR` | `weakest_pillar == 'OR'` | Are your written systems complete enough for an outsider? | You told us how much is documented. Two questions cannot test whether the undocumented part is the important part. Six can. |
| `CT-W-SI` | `weakest_pillar == 'SI'` | What would a partner actually receive for their fee? | One question asked whether training exists. It cannot describe what you would be committing to deliver, every month, for ten years. |
| `CT-W-FL` | `weakest_pillar == 'FL'` | How much of the business genuinely runs without you? | One question asked how you delegate. It cannot check that answer against what actually happened in the last ninety days. |
| `CT-W-MR` | `weakest_pillar == 'MR'` | Would this work where nobody knows your name? | One question counted your cities. It cannot tell you what makes a location work, which is what you would need to assess a partner's site. |
| `CT-W-BP` | `weakest_pillar == 'BP'` | Is your brand worth paying for? | One question counted enquiries. It cannot tell you whether an investor doing their own research would find enough to justify your fee. |
| `CT-W-PP` | `weakest_pillar == 'PP'` | Would you recognise the wrong partner? | One question asked whether you have a profile. It cannot test whether you would apply it when a persuasive candidate with cash is sitting in front of you. |

## Item 3 — one of two

| id | trigger | heading | body |
|---|---|---|---|
| `CT-RANK-MANY` | `weak_count >= 2` | Which of your {weak_count} weaker areas to work on first? | They are not equal in what they cost you. Working on the wrong one first is how a year gets spent. |
| `CT-RANK-ONE` | `weak_count == 1` | How deep does the one gap actually run? | A single weak area can be a month of work or a year of it. Nine questions cannot tell the difference, and the difference is your whole timeline. |
| `CT-RANK-NONE` | `weak_count == 0` | Nothing here is weak. So what is actually holding you back? | Nine questions can confirm that nothing is broken. They cannot tell you which area is merely adequate where it needs to be excellent — and at your level that is the only question left. |

---

# 8. CAN_DO_NOW — two sections, 11 pieces

Decision R6: **gate items and already-flagged contradictions only.** Nothing here may reveal method or give away Tier 2 analysis.

Split into two section keys, because the old single-section design had a flaw: the fallback was specified to fire "when nothing else matched", but a lead always matches, so it could never fire.

## 8a. `CAN_DO_NOW_LEAD` — exactly one, always

| id | trigger | pri | body |
|---|---|---|---|
| `CDN-LEAD-DISPUTE` | `G3 == 'Yes'` | 100 | One thing has to be settled before anything else on this page matters. |
| `CDN-LEAD-TM` | `G1 == 'Neither'` | 90 | One item below is within your control this month, and it is the one holding your result down. |
| `CDN-LEAD-CLEAN-REG` | `G1 == 'Registered' AND G3 == 'No'` | 20 | There is nothing on the legal or paperwork side holding you back. Your trademark is registered and there are no disputes. |
| `CDN-LEAD-CLEAN-FILED` | `G1 == 'Application filed' AND G3 == 'No'` | 10 | There is nothing on the legal or paperwork side holding you back. Your trademark application is filed and there are no disputes. |

Highest matching priority wins; the rest are discarded. One always fires.

## 8b. `CAN_DO_NOW_ACTION` — up to 3, or the fallback

| id | trigger | pri | heading | body |
|---|---|---|---|---|
| `CDN-RESOLVE-DISPUTE` | `G3 == 'Yes'` | 100 | Resolve the dispute. | A franchise agreement grants rights the brand has to be able to defend. Until this is settled, every conversation you have is one you cannot close. |
| `CDN-FILE-TM` | `G1 == 'Neither'` | 95 | File your trademark. | Filing is short and inexpensive, and your result stops being capped the day the application goes in. |
| `CDN-FINISH-SOPS` | `OR01 == 3` | 75 | Finish writing down your procedures. | The part that is already in your head is the part a franchise owner cannot reach. Recording it costs you nothing but time and makes everything ahead of you easier. |
| `CDN-FINISH-TRAINING` | `SI01 == 3` | 70 | Finish the training programme. | You already train your own team. Writing that down as a programme someone outside your business could follow is the same work, done once. |
| `CDN-SECOND-OUTLET` | `outlets_band == 'ONE'` | 65 | Open or plan your second outlet. | This is the milestone that changes the conversation with every investor who calls you. |

## 8c. Fallback

`CDN-FALLBACK`, section `CAN_DO_NOW_ACTION`, trigger: **no other piece in `CAN_DO_NOW_ACTION` matched.**

> There is nothing outstanding on the legal or paperwork side, and nothing we would ask you to fix before the next stage. You are ready to go further whenever you are.

When the fallback fires, **suppress the lead** — the two together read as padding. Render the fallback alone.

---

# 9. What the developer does with this

1. Create the `content_piece` table as in §1.1
2. Seed every piece in sections 2 to 8 as rows — **as data, not as code**
3. Implement the trigger evaluator per §1.2, with the NULL rule
4. Implement selection and caps per §1.4, including **omit-the-whole-section-when-empty**
5. Implement slot substitution per §1.3, and assert that `{overall}` is not a valid slot
6. Render the same HTML for the web result page and the Puppeteer PDF, so they can never drift

**Two layout rules carry over from the approved sample:** the CTA block and Ronak's bio render as one unit and never split across a page (R8); and if a non-final page ends with a large trailing gap, the document re-renders tighter (R9). Chrome honours `break-inside: avoid` properly, so both are more straightforward in Puppeteer than they were in the sample.

---

# 10. Known limits of this draft

**This is a first pass in the agreed voice, not Ronak's final wording.** It exists so the launch is not blocked and nothing gets hardcoded. Every string is a database row and can be rewritten without a deployment — which is the whole reason for the table.

Four things worth Ronak's eye specifically:

| # | Item |
|---|---|
| 1 | **Priorities are my judgement.** They decide which six Important Points a brand sees. Run the six existing test brands through and check the selections read right |
| 2 | **`WN-SCALE-FIRST` has never been exercised.** It now fires for any brand outside the `ONE` band whose procedures are not fully documented. None of the six match. The first one that does should have its report read before it goes out |
| 3 | **The upgrade block's last bullet** promises a category comparison that Decision B4 cannot deliver outside F&B, fashion and retail. Soften it, or write the education patterns |
| 4 | **Nothing here covers a capped or gated band.** When G3 fires, A5-DISPUTE already carries the explanation — confirm the two read well together rather than repeating each other |

---

# 11. Validation against the six real brands

*These were the v1.0 figures, taken before the two legal observations were removed. **§15 carries the current numbers** — use those.* The notes below still hold.

**The strongest evidence it works:** Strings selects `WN-STRUCTURE-FIRST`, `WN-SECOND-OUTLET` and `WN-NUMBERS-STEADY` — which are the three observations written by hand for that report, arrived at independently by the triggers. Its six Important Points map almost exactly onto the six notes in the approved PDF.

**Current as of v1.5. Re-validated after the switch to banded outlet data.** Every brand still fires at least three observations; Triloma drops from four to three because `WN-LEGAL-EARLY` was narrowed to single-outlet brands only. No section empties for any brand.

**One trigger was narrowed during validation.** `WN-NUMBERS-STEADY` originally read `UE01 >= 4 AND UE02 >= 3` and fired for five of six brands, which would have read as boilerplate. Worse, it called 3 Circle's sub-12-month payback and 25%+ margin "steady rather than stretched", which is wrong. It is now split: `WN-NUMBERS-STRONG` for the top combination, `WN-NUMBERS-STEADY` for the middle.

**Five pieces never fire across these six brands:** `WN-SCALE-FIRST`, `WN-PULL-WITHOUT-READINESS`, `WN-NOTHING-TO-SELL`, `WN-MARGIN-CEILING` and `WN-PAYBACK-QUESTIONED`. That is coverage for profiles not yet seen — a multi-outlet brand with no documentation, a brand with inbound demand and nothing to hand a partner, a thin margin, a long payback. **They are untested.** The first brand that trips one should have its report read before it goes out.

---

# 12. Where the hand-made samples are stale

The six PDFs written by hand in September pre-date Decision **D11**, which moved the Weak boundary from ≤60 to ≤50. **Where a sample and the engine disagree on area status, the engine is right.**

| Brand | Weak areas, live engine (≤50) | Weak areas, in the sample (≤60) |
|---|---|---|
| Triloma | 2 | 2 |
| Career Craft | 2 | 3 |
| **Strings** | **2** — Market Proof, Brand Pull | **4** — Support, Your Role, Market Proof, Brand Pull |
| QB365 | 0 | 3 |
| da' mushroom | 1 | 1 |
| 3 Circle | 3 | 6 |

So Strings' live report correctly says *"your two weaker areas"*, not four. The sample is the stale artefact, not the engine.

This was the point of D11. QB365 scored 88 overall and showed three Weak pills beneath a "Ready to Plan" badge, which read as a contradiction. At ≤50 it shows none, which is accurate.

**Two consequences worth knowing.** First, `weak_count == 0` is now a normal outcome rather than a theoretical one — hence `CT-RANK-NONE` in §7. Second, the six reports already sent to brands show more Weak pills than the live engine would produce today. Nothing to correct retrospectively, but if one of those brands buys Tier 2, expect the question.

---

# 13. Fields the live form does not collect

The samples contain lines such as *"opened in 2024, with over 1,000 students trained"*. The Tier 1 register (Spec §2) collects brand name, contact name, email, category, outlet band and city — and nothing else.

**Those lines cannot be produced and should be dropped.** No piece in this library depends on them. `{year_opened}` has been removed from the slot list in §1.3 for the same reason.

Do not add fields to close this gap. Customer counts are not comparable across categories — "1,000 students" and "1,000 covers a month" measure nothing alike — and every extra question on a free assessment costs completions. If Ronak later wants an opening-year observation, `year_opened` is one optional numeric field and a handful of new pieces, and it can be added without touching anything else.

---

# 14. Answers to the first build review, 8 October

**Outlet labels — yes, map in code.** The form shows `1`, `2–5`, `6–15`, `16+`. Store those as `ONE`, `TWO_TO_FIVE`, `SIX_TO_FIFTEEN`, `SIXTEEN_PLUS`. §1.4's labels were my assumption about the wording, not a requirement — the form's own labels stand. No database change.

**`{outlets_label}` renders the form's label verbatim**, so `TU-PROFILE` reads *"You operate 2–5 outlets, in Chennai"*. The one exception is `ONE`, which renders as "one outlet" rather than "1".

**Legal repetition — fixed by moving the boundary, not by adding suppression.** A brand with no trademark was being told the same thing five times. The rule now is: **`WHAT_WE_NOTICED` never contains a legal finding.** `WN-NO-TRADEMARK` and `WN-LEGAL-EARLY` are deleted. The message survives in exactly three places, each doing a different job — the band-cap reason under the badge explains *why the band is capped*, `LG-TM-NONE` states *the finding*, `CDN-FILE-TM` names *the action*. Three with distinct jobs is fine. Five saying the same sentence was not.

The same fix removes the Strings duplication: "before you needed to" now appears only on the Legal Check card.

**Where the pieces you could not find already live.** They are in `Content-Library-Group-A.md`, not missing:

| Element | Pieces |
|---|---|
| Verdict paragraph under the score | `A4-B1` … `A4-B5` |
| Gate reasons (trademark cap, dispute) | `A5-CLEAN` · `A5-TRADEMARK` · `A5-DISPUTE` |
| FL01 answer options | `A1-1` … `A1-5` |
| Pillar subtitles | `A2-*` |
| Weakest-pillar line | `A3-*` |

All of them belong in `content_piece` too. Seed them with the rest.

**Genuinely still missing after v1.3:** the `restatement_label` for every answer option (§4c), and second-person variants of the five A1 anchors. About forty short phrases. Nothing else.

**Range clamping.** You are right that the engine clamps to 0–100 and the scoring document did not say so. It does now. `band_count` is computed from the clamped values.

**Your lead priority order was correct** — dispute, then trademark, then clean. It is now written down rather than inferred, with the clean lead split so a registered trademark is not described as filed.

**On "each rule is asserted by a test".** That sentence described the intent, not the state of the suite. Vector 7 and the Step 4 leak assertions are both still to write, and both should land before traffic rather than after.

---

# 15. Current validation figures

| Brand | Range | Bands spanned | Observations | Weak areas | Trademark mentions |
|---|---|---|---|---|---|
| Triloma | 71–88 | 2 | 3 | 2 | 0 |
| Career Craft | 54–71 | 2 | 3 | 2 | **3** (was 5) |
| Strings | 56–73 | 2 | 3 | 2 | 0 |
| QB365 | 80–96 | 2 | 3 | 0 | 0 |
| da' mushroom | 79–95 | 2 | 3 | 1 | 0 |
| 3 Circle | 47–64 | 2 | 4 | 3 | 0 |

Removing the two legal observations costs every brand one piece and leaves none below three. No section empties.

**None of the six spans three bands**, which is why the gap went unnoticed until the full enumeration. At 5.4% it would have surfaced within the first twenty live brands.

---

# 16. Answers to the second build review, 8 October

Everything raised is accepted. Where the build and the document disagreed, the build was right three times out of three.

| # | Point | Resolution |
|---|---|---|
| 1 | §1.5 table incomplete | Rewritten with all thirteen sections. Your reading was correct: Told Us all, Legal all, lead exactly one, actions up to 3 |
| 2 | `!= NULL` not in the grammar | Correct. Replaced with `>= 1` throughout, and §1.2 now says there is no NULL literal |
| 3 | The register is config JSON, not a table | Correct. `restatement` is a **key on each option in `fra_scoring_config`**, versioned like the rest |
| 4 | The phrases mostly exist already | Correct, and my claim of "about forty to write" was wrong. It is a move from `content.ts` into config, plus a review |
| 5 | Four template wordings broken once labels slot in | All four fixed in §4c, with a table of what each slot must render |
| 6 | Group A missing, keys undefined | File attached. §4d defines every key and trigger. A1 stays in config; A3 is not shown at Tier 1; A5-CLEAN is retired |
| 7 | Verdict for capped brands | **The build is right.** The verdict follows the displayed band. Scoring Specification §8 corrected |
| 8 | Score-box sentence hardcoded | Now `SCORE_NOTE` — a fixed opener plus five band-keyed closers |
| 9 | Counts still off | Fixed: What You Told Us is 8, the ladder has three closing variants |

**Approved to start now:** build changes 1, 2 and 4 from your list, plus Legal Check into the table. Everything in §4c and §4d is specified well enough to follow immediately after.

**On the badge showing only the outer two levels** — that is the one change in your list that is a wording decision rather than a correction. It is Ronak's to overturn, but it should not hold up the build: the ladder still highlights every level the range touches, so nothing is hidden.

---

# 17. Still open, and not in this document

These are from the pre-launch list, not the content library. **None of them blocks Tier 1.**

| Item | Blocks |
|---|---|
| Razorpay not built | **Tier 2 only.** Tier 1 is free and can go live without it |
| Blue Bird Ventures invoice and GST | Tier 2 only |
| Landing page still shows ₹2,999 / ₹9,999 | **Tier 1** — it is wrong on a page the public can already see |
| Blue Bird Ventures footer missing | Tier 1, one line |

**Tier 1 does not need payments to launch.** Until Razorpay is live, the upgrade button should open a short page that captures the brand's intent and says a payment link will follow. Manual, and entirely adequate at current volume — Tier 2 is being run by hand anyway. What it must not do is 404, or sit there dead.

The landing page prices and the footer are both small and both wrong in public. They should be fixed before traffic, not after.

---

# 18. Answers to the third build review, 8 October

**Both decisions go your way.**

| # | Point | Decision |
|---|---|---|
| 1 | A2 subtitles vs the approved sample | **Seed the approved wording.** A2 predates the plain-English rewrite and is too long for a table column. Seven rows given in §4d. Settles Spec §14 items 1–2 — plain names everywhere |
| 2 | A4 and SCORE_NOTE overlap | **Score box shows `SCORE_NOTE` only. A4 is not rendered at Tier 1**, like A3. Three blocks saying "you are close" was two too many, and you spotted it before a single brand did |

**Group A wording errors — all correct, all handled.** A4's "ten questions", "forty-four" and integer band headings are moot now that A4 renders nowhere. A5's three paragraphs are cut to the first line as `GATE_REASON` (§4d). A5's `G1 = No` should read `Neither`, and the triggers in §4d are correct. A1's question text in Group A is the stale one — **the live form matches the Specification and is right**.

**Your four housekeeping items — all approved, go ahead.**

`SCORE_NOTE`, `GATE_REASON`, `PILLAR_SUBTITLE` and the restatement slots are now in the §1.1 and §1.3 lists. `GATE_REASON` is a good name and is adopted.

**Reading restatements from the active config is the right call and worth stating as a rule:** scores reproduce from the version a submission was saved under, display wording comes from the active version. That way an old report keeps its score and gains better phrasing. It is now in §1.3.

**On the upgrade button** — an inline confirmation is enough *provided it does three things*: stores the intent against the brand's record, pushes it to Zoho like any other lead event, and notifies Corporate Culture. A tick that only changes the button text would lose the exact people the funnel exists to catch. If it already does all three, it is fine as built.

**Go ahead on all five items in your list.** Nothing is waiting on Ronak any more.

---

# 19. Pricing — the single source of truth

**Every price on every surface comes from here.** If a number appears anywhere else and disagrees with this table, this table is right and the other place is a bug.

| Tier | Name | Base price | GST | Payable | Displayed as |
|---|---|---|---|---|---|
| 1 | Franchise Readiness **Audit** | **Free** | — | — | "Free" |
| 2 | Franchise Readiness **Report** | **₹1,999** | 18% | **₹2,359** | `₹1,999 + 18% GST` with `₹2,359 payable` beneath in small type |
| 3 | Franchise Readiness **Roadmap** | **₹5,999** | 18% | **₹7,079** | `₹5,999 + 18% GST` with `₹7,079 payable` beneath in small type |

**Flat fees. Nothing is credited or adjusted when a brand moves up a tier.** Decision Log P8, P10.

**The base price is stored exclusive of GST** and the total is computed and rounded to the nearest rupee. Never store `235900` as a literal — the invoice and the Razorpay charge must agree to the paisa.

**Billable entity: Blue Bird Ventures.** Corporate Culture is a brand. Decision Log P9.

*These supersede ₹2,999 / ₹9,999 everywhere, and any document showing ₹1,999 / ₹4,999 with a credit. The base figures are unchanged since 7 October; GST is added on top, not included.*

**Where the price currently appears, and what each must say**

| Surface | Required |
|---|---|
| Landing page, "What does it cost?" | Full table above, in prose — §19a |
| Landing page, "What happens after the free audit?" | **No amounts.** Points to the cost item — §19b |
| Tier 1 result page, upgrade block | `₹1,999 + 18% GST` · `₹2,359 payable` |
| Tier 1 PDF, upgrade block | Same as the result page |
| Tier 2 report, Roadmap block | `₹5,999 + 18% GST` · `₹7,079 payable` |
| Payment page and receipt | `₹2,359` charged, Blue Bird Ventures named |

**One price, one place.** The two FAQ items below are the only prose on the public site that names an amount. Everything else references them.

---

## 19a. New FAQ item — "What does it cost?"

> **What does it cost?**
>
> The Franchise Readiness Audit is free — eleven questions, about 4 minutes, and your Franchise Readiness Score appears on screen straight away.
>
> The full **Franchise Readiness Report** is **₹1,999 + 18% GST** (₹2,359). About thirty more questions, and you receive the report within 24 hours.
>
> The **Franchise Readiness Roadmap** is **₹5,999 + 18% GST** (₹7,079). It picks up where the Report stops, works through what a franchise partner would actually earn, and includes a call with our team.
>
> Each stage is priced on its own. Nothing is credited or adjusted if you move to the next one.

## 19b. Existing FAQ item — "What happens after the free audit?"

**Keep the question. Remove both amounts.** Your reading is right: two FAQ items both naming prices is how a page ends up showing ₹2,999 six months after the price changed.

> **What happens after the free audit?**
>
> Your Score gives you a range and shows which of the seven areas are strong and which are not. If you want the exact number, the **Franchise Readiness Report** gives you your precise score and a written diagnosis of all seven areas, with your gaps ranked by what each one costs you.
>
> The **Franchise Readiness Roadmap** goes further again — it works out what a franchise partner would actually earn from your business and how long their money takes to come back, and it includes a call with our team to talk it through.
>
> See **"What does it cost?"** below for prices.

**On the call:** your draft dropped it, and it should stay. Decision P4 — every Tier 3 completion gets a call, and the call is the branch point where a brand moves to the Development Kit or a retainer. It is a real part of what ₹5,999 buys, not padding.

## 19c. Footer

Every page, including the result page, the payment page, the receipt email and the PDF:

> Corporate Culture is a brand of Blue Bird Ventures

---

# 20. The Tier 2 interest signal — Zoho field

Your proposal is right: update the brand's existing `FRA_Submissions` record and let a Zoho workflow send the notification. No new email system, and the team controls recipients inside Zoho.

## The field to create

| Property | Value |
|---|---|
| Module | FRA Submissions |
| Field label | **Tier 2 Interest At** |
| Field type | **Date/Time** — not a checkbox |
| Expected API name | `Tier_2_Interest_At` |

**Date/Time rather than a checkbox**, because the useful question is not whether a brand raised their hand but *how long ago*. A brand that clicked forty minutes ago is a different call from one that clicked last Tuesday, and a checkbox cannot tell you which. It also mirrors `report_interest_at`, already in MySQL.

**Confirm the API name after creating it.** Zoho usually derives it from the label, but it appends a suffix when something similar already exists. Do not hardcode the guess.

Created in Zoho under **Setup → Customization → Modules and Fields → FRA Submissions → Add Field**.

## Who gets notified

Default: **bd@corpculture.co**, which is already the public contact on every report and page, so nothing new has to be monitored.

Whether Ronak is copied is Sakthikkumaran's call. A Tier 2 click is a buying signal from a brand that has just read its own result, and it goes cold quickly — so whoever is named should be someone who can respond the same day, not an address that is checked weekly.

## The phone number — ask at the interest step, not in the audit

You were right that the audit collects no phone number, and right to resist adding a question to a free assessment. But neither of your two options is the best one.

**Do not add it to the audit. Ask for it on the confirmation, as one optional field.**

When a brand clicks *Get my full report*, the inline confirmation shows:

> **You're on the list.** We will be in touch within one working day.
>
> *Mobile number (optional) — so we can call you back instead of emailing.*  `[________]`

This is the right moment and costs nothing. The audit is already complete, so the field cannot reduce completions. The brand has just raised their hand and wants to be contacted. And asking *because they asked* reads as service rather than data collection.

Optional, always. A brand that skips it still gets the follow-up by email. If given, push it to Zoho alongside the interest timestamp.

**Why this matters more than it looks:** a Tier 2 click is a buying signal from someone who has just read their own result. Your telecallers convert a phone call far better than an email, and this is the one moment a brand will hand over a number without being asked twice.

## What the notification carries

Brand name, contact name, email, mobile if given, displayed range and band. Everything but the mobile is already on the Zoho record. Without these the alert is just a nudge to go and look something up.

## Fire-and-forget

If Zoho is slow or down, the brand still sees their confirmation. The interest is already saved in MySQL, so a failed push is recoverable — a failed page is not. Your `ZOHO_TIER2_FIELD` fallback is exactly right: no variable, no push, nothing breaks.

---

# 21. Go — the whole thing, settled

**Start all six items.** Nothing in any document blocks the build.

| # | Item | Status |
|---|---|---|
| 1 | Engine and badge — outer two levels, `band_count`, vector 7 | Go |
| 2 | Content Library v1.7 — 13 sections seeded, A3/A4/A5-CLEAN inactive, seed SQL | Go |
| 3 | "What You Told Us" from templates, restatements in a new config version | Go |
| 4 | Tests — leak tests, three-level case, zero-weak case, Strings check | Go |
| 5 | Landing page — §19a added, §19b rewritten, §19c footer everywhere | Go |
| 6 | Upgrade button → Zoho behind `ZOHO_TIER2_FIELD`, plus the optional mobile field | Go — the Zoho field name follows |

## The two answers you asked for

**1. The old FAQ item.** Keep the question, strip both amounts, point at the cost item. Wording in §19b. Your instinct was right and the reason is worth stating: **two FAQ items both naming a price is how a page ends up showing ₹2,999 six months after the price changed.** §19 is now the single source — only §19a names an amount anywhere in public prose.

One correction to your draft: **keep "includes a call with our team"** for the Roadmap. Decision P4 makes the call the branch point where a brand moves to the Development Kit or a retainer. It is part of what ₹5,999 buys.

**2. The phone number.** Neither of your options — a third way, in §20. Do not add it to the audit; ask on the confirmation as **one optional field**, at the moment the brand has just raised their hand. Costs no completions because the audit is already done, and it is the one moment someone hands over a number willingly.

## Pricing, so this is the last time it comes up

| Tier | Base | Payable |
|---|---|---|
| 1 — Audit | Free | — |
| 2 — Report | ₹1,999 | ₹2,359 |
| 3 — Roadmap | ₹5,999 | ₹7,079 |

**GST is added on top, not included.** The base figures have not changed since 7 October; what changed is that they now live in exactly one place. §19 lists every surface a price appears on and what each must say.

## Still needed from Corporate Culture, not blocking

Create the Zoho field — **FRA Submissions → Tier 2 Interest At → Date/Time** — and send the exact API name for `ZOHO_TIER2_FIELD`. Until it is set, the button saves to MySQL and skips Zoho, which is the right fallback.

The workflow notifies **bd@corpculture.co**. Whether Ronak is copied is Sakthikkumaran's call — the argument for copying him is that a Tier 2 click is a buying signal from a brand that has just read its own result, and it goes cold within days.

---

# 22. Copy rulings for the build, 8 October

Four wording changes were made in the build to match the Decision Log and this library. **Three required no approval — they enforce copy already approved here.** One is a genuine new decision and is marked pending.

## 22.1 Price — **approved, no decision needed**

₹2,999 → **₹1,999 + 18% GST**, and the offer card reading **`₹1,999 + 18% GST · ₹2,359 payable`**. This is §19a verbatim and Decisions **P8, P10**. The build was wrong and is now right; there was nothing to approve.

## 22.2 "Answer about thirty more questions" — **approved, no decision needed**

Matches §3 `UPGRADE-TIER2` and §19a exactly. **Never state a fixed Tier 2 question count in public copy** — it varies by outlet band and category. `CANONICAL-VALUES.md` §8.

## 22.3 The total count — **"About 40" is wrong. Remove the total instead**

| | |
|---|---|
| Was | "44 — your 11 carry over" |
| Changed to | "About 40" |
| **Ruling** | **Neither. Carry no total in the comparison table.** |

11 carried + 32 for a single-outlet brand = **43**, and up to **46** with the outlet-band questions. Both "44" and "About 40" are falsifiable by a founder who counts, and in opposite directions.

**Table wording:** *"Your 11 answers, plus about thirty more"* — no total.

`CT-INTRO` is corrected in §7 from "decided by forty" to **"decided by more than forty"**, which is true at every outlet band.

## 22.4 "The report answers all three" — **not approved as written**

This box sits directly under `CANNOT_TELL`, which is the page's honest-limits section, and it is the one place on the result page where an overclaim does real damage.

**Three objections.**

**It contradicts five of the seven items it sits under.** `CT-W-UE` and `CT-W-OR` end with *"Six can."* — a deliberate, scoped forward-pointer. `CT-W-SI`, `CT-W-FL`, `CT-W-MR`, `CT-W-BP` and `CT-W-PP` pointedly do not. A blanket "answers all three" asserts for all seven what the library claims for two.

**For at least one selection it is false.** `CT-W-MR` says the audit cannot tell you *what makes a location work*. Site criteria are withheld to the Development Kit by design — the Report does not supply them. The box would promise something two tiers away.

**It is the same failure as the trademark message appearing five times**, and it has the same fix: a boundary, not a suppression. `CANNOT_TELL` states limits. It does not sell.

**Proposed replacement — `CT-CLOSE`, trigger `ALWAYS`, pending Ronak's sign-off:**

> *These three are the reason the Report exists. It works through each of them with your own numbers.*

True at every selection, converts, and promises a process rather than a complete answer.

**Separately to settle:** the `CT-W-*` asymmetry. Either all seven carry a scoped forward-pointer like *"Six can"*, or none do. Five silent and two speaking is an inconsistency a blanket box was papering over.

## 22.5 Comparison table and step wording living in code — **the real finding**

These strings are in `content.ts`, not in this library. **That is the mechanism that put ₹2,999 in six files.** A user-facing string in code is a string that will be wrong within six months, and nobody will know which file to open.

**Not a launch blocker.** Approve the current wording as built, then move it into the library as `UPGRADE-COMPARE-*` and `UPGRADE-STEP-*` keys in the same migration §14 already describes — *"a move from `content.ts` into config plus a review by Ronak, not forty phrases written from scratch."*

**Standing rule from here:** no new user-facing string is written in code. If a screen needs copy the library does not have, that is a library gap — raise it and it gets a key.
