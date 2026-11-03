# Tier 2 Questionnaire — the single-outlet set

**Version 1.2 · 22 October 2026**

> **v1.2** — **`MR5`'s scoring map is confirmed** *(Ronak, 22 October · T141)*: `<=1 → 1 · <=2 → 2 · <=4 → 3 · <=7 → 4 · else 5`. **The last `[RONAK]` marker in the instrument is gone.**

> **v1.1** — **`OR6`, `MR5` and `PP6a` are written** *(T128)*. All three existed only as exclusion rules — named in two tables and a null-handling note, with no stem, no options and no scoring map anywhere. **A brand with two or more outlets could not be served**, and `MR5`'s open scoring was the same hole rather than a separate item. **The maximum set is 34, not 35** *(T129)*: the approved sample's own arithmetic — 11 carried + 34 asked = 45 — settles it. **Scoring maps marked [RONAK] need his confirmation before launch; the stems do not.**

**32 questions.** This is the **standard Tier 2 instrument for a brand with one outlet**, not a questionnaire written for one brand. Nothing in the question set below is specific to any brand, category or city. It was first sent to Strings Music and Arts Academy, which is the only reason the filename carries that name.

**Counts** — `CANONICAL-VALUES.md` §8 is the authority:

| | |
|---|---|
| Full Tier 2 set | **up to 34** *(T129 — was wrongly 35)* |
| A single-outlet brand sees | **32** |
| A multi-outlet brand sees | **34** — `OR6` and `MR5` are added |
| Carried from Tier 1, never re-asked | **11** |
| Public wording | *"about thirty more questions"* — never a fixed number |

**What varies, and why 32 and not 35.** The set adapts to the brand; it does not change for the brand.

| Code | Behaviour |
|---|---|
| `OR6` | Asked when `outlets_band != 'ONE'`. Otherwise **null** — never 0 |
| `MR5` | Asked when `outlets_band != 'ONE'`. For a single-outlet brand it derives to **1** from the Tier 1 profile and is not re-asked |
| `PP6a` / `PP6b` | A swap, not a removal. `PP6a` for a brand with existing franchisees, `PP6b` for one without. **Exactly one is always asked** |

**Where the three sit on screen** *(Design, v62 — confirmed and recorded here so it is not asked again)*:

| Code | Sub-screen |
|---|---|
| `OR6` | **Its own screen, straight after `OR5`** — every anchored question gets one |
| `MR5` | **Between `MR4` and `MR6`**, in the order printed below |
| `PP6a` | **`PP6b`'s slot.** They are mutually exclusive, so the screen is the same one either way |

**No new sections, and the count stays eight.** Progress reads *"Section 3 of 8"* and never *"question 11 of 32"*, which is exactly why a variable question count costs nothing on screen.

**Why the maximum is 34 and not 35** *(T129)*. 32 single-outlet, plus `OR6` and `MR5` for a multi-outlet brand. **`PP6a` adds nothing — it replaces `PP6b`.** The approved sample proves it: Chai Junction has three outlets and no franchisees, so it is the maximum case, and its cover prints **11 carried + 34 asked = 45**. `CANONICAL-VALUES.md` §8 said *up to 35* and was off by one.

**`Tier2-Platform-Build-Spec.md` §2.2 omits `MR5` from its conditional table** and lists only `OR6`, `PP6a` and `PP6b`. **It is the binding file for the architecture, so the omission would have been built.** Corrected there too.

**A multi-outlet brand sees more than 32.** Design must treat the question count as variable and the section count as fixed at eight — which is why progress is shown as "Section 3 of 8" and never "question 11 of 32".

*Corrected 8 October: the previous header said 29 questions and a full set of 31. The body has always held 32, which agrees with `CANONICAL-VALUES.md` §8 and the Screen Flow Spec. The header was wrong, not the questions.*

- **OR6** excluded — needs 2+ outlets
- **PP6a** excluded — for brands with existing franchisees; he gets **PP6b** instead
- **MR5** carries from Tier 1 (1 outlet)

Scoring maps are shown for internal use. **They do not appear on the form.**

---

## Section 1 — Your numbers

**1. Current company-level EBITDA margin** *(UE7)*
Numeric %
`<=5 → 1 · <=10 → 2 · <=15 → 3 · <=20 → 4 · else 5`  *(upper-bound inclusive, D21)*

**2. Company-level profitability track record** *(UE8)*
- Profitable for 2+ years `5`
- Profitable for 1 year `3`
- Breakeven `2`
- Loss-making `1`

**3. Debt, encumbrances or personal guarantees that would restrict franchising or concern an investor** *(UE9)*
- None `5` · Manageable `3` · Yes, material `1`
*Allow "prefer not to answer" — stores as null.*

**4. Have you benchmarked your investment ask against comparable formats in your category?** *(UE12)*
- Formally `5` · Informally `3` · No `1`

---

## Section 2 — Your systems

**5. Could your POS, inventory and tech setup be handed to an outlet you do not own and run the same way?** *(OR3)*
- Yes `5` · Partial `3` · No `1`

**6. Is there a defined quality check — a checklist, audit or mystery-shop routine — that someone other than you could run?** *(OR4)*
- Yes `5` · Partial `3` · No `1`

> **Both stems were changed on 13 October.** They previously ended *"across all outlets"*, which a single-outlet brand answers "Yes" to honestly and collects a top score on two of five Operational Readiness values for nothing — on the pillar carrying 20% weight. The questions were never asking whether one shop is internally consistent; they ask whether the thing could be handed to an outlet we do not own. Help copy in `Content-Library-Tier2-Field-Help.md` §3.2.

**7. How ready is your supply chain to serve an outlet you do not own, in a city you are not in?** *(OR5 — anchored)*
1. Sourcing is local and informal — relationships I manage personally. A new outlet elsewhere would have to find its own suppliers.
2. I have regular suppliers, but no written terms or agreed rates. Pricing depends on the relationship.
3. Key inputs come from named suppliers on agreed rates, but coverage is limited to the cities I currently operate in.
4. Contracted suppliers with defined rates and delivery terms, able to serve new locations with some lead time.
5. A structured supply chain — contracted vendors, defined specifications, and a documented process for onboarding a new outlet anywhere we operate.

**7a. How consistent are your outlets with each other — the same product, the same standard, the same way of running?** *(OR6 — anchored · asked only when `outlets_band != 'ONE'`)*
1. Each outlet has found its own way of working. What a customer gets depends on which one they walk into.
2. The core offer is the same everywhere, but standards drift between outlets and we correct it when somebody notices.
3. Outlets are broadly consistent on product and service. The differences are in how each one is run day to day.
4. Outlets run to the same written standard, and where they differ it is an exception we can explain.
5. A customer could not tell which outlet they are in. The same standard is specified, checked and held across all of them.

> **`OR6` is the only question in the instrument that a single-outlet brand cannot answer at all** — and for a multi-outlet brand it is the strongest evidence in the Report. **A second outlet running to the same standard is the thing a franchise sells.** It sits in Operational Readiness at 20% weight, and it is the question whose answer a founder is least able to flatter: his own customers already know.
>
> **Not a duplicate of `FL4`.** `FL4` asks what happens when the founder is absent; this asks what happens in a building he is not standing in. A founder can score well on one and badly on the other, and the pair is more informative than either alone.

---

## Section 3 — Your brand

**8. Is there a brand identity manual — logo usage, store design, signage, packaging?** *(BP2)*
- Yes `5` · Partial `3` · No `1`

**9. Average Google rating** *(BP3)*
Numeric
`<=3.5 → 1 · <=4.0 → 2 · <=4.3 → 3 · <=4.6 → 4 · else 5`  *(upper-bound inclusive, D21)*

**10. Total Google reviews** *(BP4)*
Numeric
`<=100 → 1 · <=500 → 2 · <=2000 → 3 · <=5000 → 4 · else 5`  *(upper-bound inclusive, D21)*

> **BP3 and BP4 lost "across outlets" / "across all outlets" on 13 October.** The phrase reads oddly to a single-outlet brand and carries no scoring effect — unlike OR3 and OR4, there was no free score available. The multi-outlet case moved into the help notes. **BP5's option 4 keeps the phrase deliberately**: rewriting an anchored sentence changes the instrument, and its bias runs downward, which is the safe direction. Under review after fifty submissions.

**11. How clearly is your brand promise defined and consistently delivered?** *(BP5 — anchored)*
1. We have not defined it in words. Customers come for the product; what the brand stands for is not something we have articulated.
2. I could describe what we stand for, but it is not written down and my team would each say it differently.
3. The brand promise is defined and my team can state it, though how consistently it is delivered varies.
4. Defined, documented and reflected in how we operate — customers experience it consistently across outlets.
5. Defined, documented, trained and audited. A new outlet would be held to it, and we would notice if it slipped.

---

## Section 4 — Your market

**12. Is customer demand validated by data — repeat purchase, footfall — or mostly anecdotal?** *(MR2)*
- Data-backed `5` · Partially `3` · Anecdotal `1`

**13. Have you defined site selection criteria — catchment, footfall, size, adjacency?** *(MR3)*
- Yes `5` · Partial `3` · No `1`

**14. Have you defined a city or territory rollout sequence?** *(MR4)*
- Yes `5` · Partial `3` · No `1`

**14a. How many outlets are trading today?** *(MR5 · asked only when `outlets_band != 'ONE'`)*
Numeric
`<=1 → 1 · <=2 → 2 · <=4 → 3 · <=7 → 4 · else 5`  *(upper-bound inclusive, D21)*  **Confirmed by Ronak, 22 October *(T141)*.**

> **For a single-outlet brand this derives to 1 from the Tier 1 profile and is not asked.** The profile already holds the number; asking a founder to retype it is friction for nothing.
>
> **The bands, confirmed.** One outlet proves the business, not the model. **Two is the first real replication** and the largest single step in the instrument — it is where a founder stops guessing which parts of his success were the location. Three to four shows a pattern; five to nine a small chain running on systems rather than attention; ten or more a model that has survived its own growth. **Ronak moved the fourth band down from 5–9 to 5–7, so eight outlets now scores top rather than nine** *(T141)*. **A brand at three outlets scores 3 either way, so the approved sample is unaffected.**

**15. Do you track footfall or customer count per outlet systematically?** *(MR6)*
- Systematically `5` · Approximately `3` · Not tracked `1`

---

## Section 5 — Your partners

**16. Is there a documented franchisee selection and qualification process?** *(PP2)*
- Yes `5` · Partial `3` · No `1`

**17. Have you defined territory rights and exclusivity terms?** *(PP3)*
- Yes `5` · Partial `3` · No `1`

> **`PP4` stays here — third in Section 5, between `PP3` and `PP5`** *(T79)*. `questions.json` had it last, after the fee question. It is the anchored question of this section and belongs beside the partner questions it diagnoses. **One order governs display, `seq` and the review screen.**

**18. If a serious investor asked tomorrow what they would receive for their money, how completely could you answer?** *(PP4 — anchored)*
1. I would describe the business opportunity, but not the specifics of what the brand provides in return.
2. I could explain it verbally, but nothing is written down and the details would differ between conversations.
3. The core elements are defined — brand rights, training, initial support — though territory and ongoing obligations are still loose.
4. A documented offer covering brand rights, territory, training, launch support and ongoing obligations on both sides.
5. A complete, documented offer that an investor could review independently and take to their own advisor.

**19. Will partners be owner-operators or investor-operators, and is support built for that?** *(PP5)*
- Decided and supported `5` · Decided only `3` · Undecided `1`

**20. Have you defined a preliminary franchise fee and royalty structure?** *(PP6b · asked only when the brand has no existing franchisees)*
- Yes `5` · Partial `3` · No `1`

**20a. Is your existing franchise fee and royalty structure documented, and the same for every partner?** *(PP6a · asked only when the brand has existing franchisees)*
- Documented, and the same terms for all `5`
- Documented, but terms vary by partner `3`
- Negotiated case by case `1`

> **`PP6a` and `PP6b` are mutually exclusive and exactly one is always asked** *(build spec §2.2)*. **They are not the same question in two tenses.** `PP6b` asks a brand with no partners whether it has thought the structure through. `PP6a` asks a brand that already has partners something harder: **whether the terms it gave them are the same terms.**
>
> **A structure negotiated partner by partner is the most expensive mistake in this section** and the hardest to undo — every later partner negotiates against the best deal any earlier one got, and the founder cannot show a prospect a standard offer because there isn't one. **A brand with five franchisees on five sets of terms scores 1 here and should.**

---

## Section 6 — Your support

**21. Duration of initial franchisee training you could deliver today** *(SI2)*
- None `1` · Less than 3 days `2` · 3–7 days `3` · 1–2 weeks `4` · 2+ weeks `5`

**22. Is marketing support capability — creative, campaigns, local activation — available to outlets?** *(SI3)*
- Yes `5` · Partial `3` · No `1`

**23. Is there a named person or team accountable for franchisee support after launch?** *(SI4)*
- Yes `5` · Partial `3` · No `1`

**24. Is there a team member beyond the founder capable of supporting franchise operations?** *(SI5)*
- Yes `5` · Partial `3` · No `1`

**25. Hours per week leadership can realistically dedicate to franchise support in year one** *(SI6)*
- Less than 5 `1` · 5–10 `2` · 10–20 `3` · 20–30 `4` · 30+ `5`

---

## Section 7 — Your role

**Order changed 13 October — FL5 now comes first.** *(Decision T49.)* It is the only countable fact in the section, and asked last it was being answered under pressure to agree with the three self-ratings above it. Asked first, the self-ratings are given against a figure already on record. The four sub-screens are unchanged in number.

**26. In the last 90 days, on how many days did the business operate without you present or on call?** *(FL5)*
Numeric
`<=0 → 1 · <=10 → 2 · <=30 → 3 · <=60 → 4 · else 5`  *(upper-bound inclusive, D21)*

> **This is the most important question in the section, and it is asked first for that reason.** The three that follow are self-assessments; this one is a countable fact. Where it contradicts them, the report trusts this answer and says so.

**27. How much of what you do informally are you prepared to convert into fixed process?** *(FL2 — anchored)*
1. Our advantage is judgement and flexibility. Standardising it would take away what makes us good.
2. I accept some things need documenting, but the parts that matter most depend on experience that cannot be written down.
3. I am willing to standardise most operations, though I would want to keep discretion over quality and customer decisions.
4. I want the business documented, including the parts I currently handle by instinct. I have started this.
5. Standardisation is already underway as a deliberate project — the goal is that anyone trained can reproduce our result.

**28. Over the last twelve months, how much did the business depend on your personal funds to operate?** *(FL3 — anchored)*
1. I have put in personal funds several times to cover operating costs or payroll.
2. I have covered occasional shortfalls, or the business depends on a personal guarantee I have given.
3. The business covers its operating costs, but I have funded growth or capital expenditure personally.
4. The business funds its own operations and most of its growth. My involvement is strategic, not financial.
5. The business is fully self-funding, generates surplus, and has no personal guarantees outstanding.

**29. When you are not present, how consistent is what the customer receives?** *(FL4 — anchored)*
1. Noticeably different. Customers and staff both know when I am not there.
2. Broadly similar, but standards slip in ways I have to correct afterwards.
3. Consistent for routine operations. Anything unusual waits for me or gets handled inconsistently.
4. Consistent across routine and non-routine situations. My team handles exceptions using defined guidance.
5. Indistinguishable. The customer experience does not depend on whether I am in the building.

---

## Section 8 — Legal position

*Reassurance line: these stay private and only affect your own result.*

**30. Is there a documented franchise agreement template, even in draft?** *(G2)*
- Yes · Partial · No — *flag only, no band effect*

**31. Is the business entity structured in a way that can legally support franchising?** *(G4)*
- Yes · No — *flag only, no band effect*

**32. Are the statutory licences for your category current and replicable in a new location?** *(G5)*
- Yes · Partial · No — *flag only, no band effect*

---

> **The four numeric maps were rewritten upper-bound-inclusive on 14 October**, after the developer's audit found the same gap-and-overlap defect D21 fixed for the score bands. Previously `5–10` and `10–15` both claimed 10, `3.5–4.0` and `4.0–4.3` both claimed 4.0, and so on. **Each boundary value needs a test case.** `SI2` and `SI6` present their bands as options rather than taking a number, so no edge exists there.

## Internal notes for the manual run

**Nulls, not zeros.** OR6 and PP6a are not asked. They must be recorded as null and excluded from the denominator. OR scores on OR3, OR4, OR5 and the two carried Tier 1 answers — five values, not six.

**Carried from Tier 1 — do not re-ask.** Payback and margin (UE), SOPs and workflow coverage (OR), enquiries (BP), cities tested and outlet count (MR), partner profile (PP), training programme (SI), delegation (FL).

**His Tier 1 score of 64.40 is superseded.** Tier 2 produces the final number and it never moves again.

**Watch for contradictions.** He said at Tier 1 that a manager runs the day to day within limits he sets. If FL5 comes back low — few or no days without him — that gap is the most valuable sentence in his report.

**Still to settle:** whether this pilot is paid, free, or deferred. Worth deciding before he fills it in, not after.


---

# Test cases — the scoring maps and the escapes

**Written 16 October.** These did not exist; `Response-to-Developer-Audit.md` item 29 reported them as added and they were not.

**The build is correct when it reproduces every row below.**

## 1. Band edges — the D21 cases

**Every map is upper-bound inclusive.** A value sitting exactly on a boundary scores the **lower** band. These are the values that overlapped before the maps were rewritten, so each one is a regression test.

| Code | Input | Expected | |
|---|---|---|---|
| `UE7` | `5` | **1** | on the edge, not 2 |
| `UE7` | `5.01` | 2 | |
| `UE7` | `10` | **2** | |
| `UE7` | `15` | **3** | |
| `UE7` | `20` | **4** | |
| `UE7` | `20.01` | 5 | |
| `UE7` | `0` | 1 | floor |
| `BP3` | `3.5` | **1** | |
| `BP3` | `4.0` | **2** | |
| `BP3` | `4.3` | **3** | |
| `BP3` | `4.6` | **4** | |
| `BP3` | `4.7` | 5 | |
| `BP4` | `100` | **1** | |
| `BP4` | `500` | **2** | |
| `BP4` | `2000` | **3** | |
| `BP4` | `5000` | **4** | |
| `BP4` | `5001` | 5 | |
| `BP4` | `1200` | **3** | **The Chai Junction regression.** The sample had this as 5 and the whole narrative was built on it |

## 2. The escape answers

| # | Case | Expected |
|---|---|---|
| S-1 | `UE7` = *I don't know my margin* | **NULL.** Excluded from UE's sum **and** its count — never scored 0. Measurement flag set |
| S-2 | `UE9` = *Prefer not to answer* | NULL, same treatment. **No flag** — a deliberate withhold is not a measurement gap |
| S-3 | `BP3` = *We don't have a Google listing* | NULL. BP scored on its remaining answers |
| S-4 | `BP3` **and** `BP4` both no-listing | Two NULLs. **BP scores on 3 answers and is still assessed** — see S-7 |
| S-5 | `G2`, `G4` or `G5` = *I don't know* | **Flag only, no band effect.** Named in the Report; the pillar's count is unchanged |
| S-6 | Three or more *I don't know* across the form | The Report leads with the measurement finding rather than the score |
| S-7 | **T81 — the guard** | **For every pillar, the minimum achievable answer count is at least 3.** UE bottoms out at 4 of 6, BP at 3 of 5, the other five pillars have no escapes. **If this assertion ever fails, T46's "not assessed" state has become reachable** and the Report needs its block text wired up |

**S-7 is the one that is supposed to never fire.** It exists so that adding an eighth escape answer announces itself, instead of silently producing a pillar scored on one reply in front of a paying customer.

## 3. A NULL is never a zero

| # | Case | Expected |
|---|---|---|
| N-1 | UE answers `[2,5,3,3,3,NULL]` | `(16 ÷ 5 ÷ 5) × 100 = 64.0` |
| N-2 | The same set with NULL read as 0 | `(16 ÷ 6 ÷ 5) × 100 = 53.3` — **wrong, and this is the failure mode to catch** |

**The two differ by more than ten points on one answer.** A build that treats NULL as zero passes most tests and quietly tells founders they are worse than they are.
