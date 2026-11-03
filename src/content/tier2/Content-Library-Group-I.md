# Content Library — Group I: the Report's own blocks

**Version 1.17 · 22 October 2026**

> **v1.17** — **§5.0 still carried the notation it replaced** *(Design, v64)*: the old `{label} · {answer}` line and *10–15%* as the `UE7` example, when the figure is 9% and the `·` was dropped. **A rule that contradicts itself in two lines is worse than no rule** — Design built to the right paragraph and was right to flag the other two. Also: **the sample's Section 02 finding still quoted the company margin as 10–15%** *(T138)*.

> **v1.16** — **The sample is regenerated to §5 and now verified by a script on every build** *(T137)*. Design checked the v1.15 sample against the scores and found **fourteen labels disagreeing with §5, three answers that were not options at all, and a figure that could not produce its own pillar score** — plus four wrong anchored options already shipped in v2.8. **Hand-maintaining forty answers was the cause of all of it**, so `verify_sample_answers.py` now checks every label against §5, every answer against the option its score requires, and every figure against its band. **Chai Junction's `UE7` is 9%.**

> **v1.15** — **§5's rule and the sample have never agreed, and Design would not build until one gave way** *(T135)*. §5 says *label, then the answer exactly as he saw it, never paraphrased*; the sample prints forty paraphrases with no labels. **§5 wins.** Paraphrase is what let three lines quote options the founder never chose *(T134)*, and it is the only form of that bug that exists. **The three gate rows leave §5** — gates render in Section 05, so the set is 41, not 44.

> **v1.14** — **Labels for `OR6`, `MR5` and `PP6a`**, the three questions written today *(T128)*. A multi-outlet brand's Section 06 would otherwise have listed three answers with no names. **`T2R-CTA` is rewritten and the Section 10 confirmation strings are added** *(T127)*: the Roadmap cannot be started yet, so the button stops saying *Start*.

> **v1.13** — **The nine carried Tier 1 answers had no labels** *(T123)*. §5 wrote twenty-nine labels for Tier 2's questions and none for the Tier 1 answers that render in the same list — **the developer's last real content gap.** **Singular forms added for every counted string** *(T124)*: the Report could print *"One more places"*, *"One answers moved it down"* and *"1 items"*.

> **v1.12** — **`T2R-05-INTRO` was written to fix a sentence that was never in it** *(T118)*. T106 replaced Section 05's intro because it "said findings cap a result" — **it does not and never did; that sentence was Section 03's note**, which was corrected separately. The sample's real intro is fuller and better, and is restored as Lifted. **The five scale labels are written out as five rows** instead of a prose range *(T119)*, because a key index built from `"-1 to -5"` is guesswork. `I-NN-G2-PARTIAL` is in the sample.

> **v1.11** — **`T2R-CTA-REVIEWED` keyed, and my own regeneration fix was wrong** *(T117)*. The Roadmap card's *"Reviewed by an analyst"* promises the **Roadmap**, not this Report; I replaced it with `T2R-BIO-LINE`, which is past tense and about the Report, inside a Tier 3 purchase card. **The fault was the anonymity, not the sentence.** Two claims now, one each.

> **v1.10** — **Design's v55 build found three duplications and one more of my guesses** *(T112–T114)*. Section 10 was offering two ways to make contact and one of them was WhatsApp, which Ronak had just ruled against. Section 08 was disclosing its thin pool twice. **`T2R-COVER-INTRO`'s token is `{score}`, not `{band}` — I guessed it when I restored the clause.**

> **v1.9** — **Ronak has read all six Authored strings and they are approved** *(T111, 20 October evening)*. One change: `T2R-08-FOOT`'s *"brands we have assessed"* becomes *"brands we have worked with"*. **The four credentials are confirmed as printed.** Nothing on Screen 6 is now unread, and the three held strings release to the boards.

> **v1.8** — **`O6` is closed: Ronak Patel, Founder & CEO, Corporate Culture** *(Sakthikkumaran, 20 October · T110)*. The label above it is keyed too — **the sample prints "Who conducts your audit" and the library had never recorded it.**

> **v1.7** — **Design's v54 review, and two more of my §6 lines were wrong.** `T2R-03-INTRO` is the **cover** paragraph, not Section 03's — I keyed it by guess and Design found it rendered on the cover *(T107)*. **§6.6's "the credentials are not repeated here" was an aesthetic preference asserted over an approved sample** that shows all four, in the one place on the Report where a founder is deciding whether to pay for Tier 3 *(T108)*. `T2R-02-INTRO` and `T2R-06-INTRO` are replaced by the sample's own wording and become Lifted; the bar table's missing header is keyed; and the Section 03 legal note finally gets a key *(T109)*.

> **v1.6** — **Design's v52 review, and it found a contradiction I had ruled on too fast.** I told Design the approved sample was the reference for Section 05; the sample marks a *filed* trademark and a *draft* agreement **Clear**, while §4 of this file calls both findings. **Both were right about different things, and two states could not hold them** — so Section 05 gains a third, `T2R-INPROGRESS` *(T103)*. The gate rows also gain a stated order and Clear-state text, `G3`'s row title stops reading as though a dispute exists, and **§6.7's provenance claim was false for ten of its sixteen keys** *(T105)*.

> **v1.5** — the developer's third pass. **Ten more labels lifted out of the build script** *(§6.7)*; the question count becomes computed *(T99)*; the band note gains top and bottom variants; **`LF-UNMEASURED` added — T44 created that finding in October and no detector carried it** *(T100)*; Section 05 now lists clean gates and never disappears *(T98)*; `T2R-FINAL` stops being defined twice; **`T2R-BIO-ROLE` reverts to `[NEEDED]` — Ronak's title is Open Item O6 and I invented one.**

> **v1.4** — the last three gaps closed. **§6 gives the Report its headings** — every section title, scale label, status marker and the reviewer block existed only inside `build_tier2_chai.py`, which is the developer's 17 October blocker. **§4.0 adds Report text for `G1` and `G3`**, whose only copy was written for the Audit's result page and said the band was capped, which is false in a Report. **§6.5 gives the glance strip the Section 05 row titles it referenced and never had.**

> **v1.3** — Ronak's §2.4 review applied: four detectors kept, three sharpened. **The `I-CONTRA-*` notes and the `LF-*` detectors were two overlapping systems** — two notes were strict subsets of a detector, which the spec's §4.3 forbids and which would have shown a founder the same finding twice. **One set now: nine detectors.** The two unique notes are promoted with their approved wording; the two duplicates retire. Three advice lines recast as positions *(P6)*, at the same strength.

> **v1.2** — **reconciled with `Tier2-Platform-Build-Spec.md`.** §1.1 becomes the spec's priority-ordered detector table with the five legal gates added as detectors; §1.2 keeps four plain-gate leads; **§2.4 drafts the seven contradiction findings the spec assigns to Ronak**; §3.2 adopts the spec's ranking rule over mine; §4.3b adds the `Partial` blocks both documents had missed. **Settles the spec's Open Item O16** and fixes a superset defect in its own detector set.

> **v1.1** — Ronak's review applied. **§2.3 approved unchanged; §1.3 has five blocks kept and sixteen revised**, his notes recorded against each. Open checks 2 and 4 resolved; `I-NN-G4-DK` gives up its "cheapest" claim.

> **§1.3 and §2.3 are approved by Ronak and can be seeded.** **§2.4's seven findings are drafts awaiting him.** Everything else is reconciled with the build spec and final.

> ## Reviewed and applied — 20 October 2026
>
> **§1.3, §2 and the Group F amendments are all through Ronak.** Twenty-one lead blocks, nine contradiction detectors, four Tier 3 actions.
>
> **Nothing in this file is awaiting him.** The only Group I item still open is §1.2's four legal leads, which he has not been asked to read — they are gates, not judgement calls.

Written because the developer traced the Chai Junction sample against the libraries on 17 October and found **five blocks of Screen 6 with no library source at all**. The sample reads as a complete Report, which is why nobody caught it for two weeks — **its prose was hand-written into `build_tier2_chai.py`, not assembled from anything.** Every block he could trace came from a library; these five came from me typing them into a build script.

| § | Report section | Status |
|---|---|---|
| **1** | **01 · The lead finding** | **Complete** — reviewed |
| **2** | **02 · Where else your answers disagree** | **Complete** — reviewed, one merged detector set |
| **3** | **03 · Against your free result** | **Complete** |
| **4** | **05 · Non-negotiables — `G2`, `G4`, `G5`** | **Complete** |
| **5** | **06 · "What you told us" labels** | **Complete** |
| **6** | **The Report's headings, labels and markers** | **Complete** — the developer's blocker, 17 October |

---

# 1. Section 01 — the lead finding

**R13: the Report opens with one named lead finding before any pillar detail.** A founder who reads one page should read the finding that most changes what he does next.

## 1.1 Which block fires — reconciled with the build spec

**`Tier2-Platform-Build-Spec.md` §4 is the architecture and it wins.** Section 01 is a **priority-ordered set of detectors**, exactly one of which fires. It is not a choice between a blocker and a gap, which is what v1.0 of this library assumed before that spec was found.

**What v1.0 got right survives as the fallback.** The spec's lowest-priority detector, `LF-NO-CONTRADICTION`, fires when nothing else does and leads with the costliest ranked gap — which is exactly the twenty-one blocks in §1.3.

**What changes: the legal blockers become detectors with priorities** rather than a separate rule that overrides everything. Same outcome for a brand with a broken entity, expressed in one mechanism instead of two.

### The table

| Priority | id | Fires when | Lead |
|---|---|---|---|
| 120 | `LF-DISPUTE` | `G3 == Yes` | §1.2 |
| 115 | `LF-PAPER-NO-ENTITY` | `G4 == No AND G2 == Yes` | §2.1 |
| 112 | `LF-NO-ENTITY` | `G4 == No AND G2 != Yes` | §1.2 |
| 102 | `LF-FEE-ON-SAND` | `UE7 >= 4 AND (UE8 <= 2 OR FL3 <= 2) AND PP6b == 5` | §2.1 |
| 100 | `LF-MONEY-DISAGREE` | `UE7 >= 4 AND (UE8 <= 2 OR FL3 <= 2) AND PP6b != 5` | §2.1 |
| 96 | `LF-TWO-MARGINS` | `UE7` falls inside `UE02`'s band | §2.1 |
| 92 | `LF-RATED-NOT-RUN` | `FL4 >= 4 AND FL5 <= 2` | §2.1 |
| 88 | `LF-SYSTEM-UNCHECKED` | `OR01 == 5 AND OR4 == 1` | §2.1 |
| 80 | `LF-SUPPLY-OVERRATED` | `OR5 >= 4 AND outlets_band == ONE AND OR3 <= 2` | §2.1 |
| 78 | `LF-UNMEASURED` | three or more `I don't know` answers across the form *(T44)* | §2.1 |
| 74 | `LF-DEMAND-UNREAD` | `MR2 == 1 AND MR6 == 5` | §2.1 |
| 72 | `LF-THIN-BASE` | `BP3 > 4.5 AND BP4 < 25` | §2.1 |
| 70 | `LF-LICENCES` | `G5 == No` | §1.2 |
| 68 | `LF-TRADEMARK` | `G1 == Neither` | §1.2 |
| 60 | `LF-AGREEMENT` | `G2 == No` | §1.2 |
| 10 | `LF-NO-CONTRADICTION` | always | **§1.3**, the costliest ranked gap at its severity |

### A defect in the spec's own set, by its own rule

**§4.3 forbids one detector being a superset of another**, because §5 renders everything that fired and a duplicated finding reads worse than a missing one.

**`LF-PAPER-NO-ENTITY` as written — `G2 == Yes AND G4 == No` — would have been a subset of any general entity detector.** Adding the blockers exposed it. **`LF-NO-ENTITY` therefore carries `AND G2 != Yes`**, so the pair separates cleanly and only one can ever fire.

The other legal detectors name different gates and are not supersets of each other. A brand can fire both `LF-LICENCES` and `LF-TRADEMARK`; those are two findings, not one finding twice.

### Where a detector goes when it fires but does not lead

**This is the one place the spec needed extending.** §5 sends every non-leading detector to Section 02. That is right for contradictions and **wrong for legal gates** — a lapsed licence is not a disagreement between two answers.

| Detector type | Non-leading home |
|---|---|
| The seven contradictions | **Section 02**, as note cards, up to four in priority order *(spec §5)* |
| The five legal detectors | **Section 05**, the non-negotiables — never Section 02 |

### This settles Open Item O16

**The spec's §7 leaves O16 unresolved:** is `G4 = No` a harder blocker than an unfiled trademark, given the trademark caps the band and the entity does not?

**Yes, and the priorities say so.** `LF-NO-ENTITY` sits at 112, above every contradiction; `LF-TRADEMARK` sits at 68, below them. **An entity that cannot grant the rights makes the agreement unenforceable in the part that matters; an unregistered trademark makes it weaker but still an agreement.** Neither touches the band — §7 is unchanged — but they are not equally urgent and the Report should not imply they are.

## 1.2 The legal leads — four blocks

**`LF-PAPER-NO-ENTITY` is a contradiction, not a plain blocker, and its text lives in §2.4** with the other detectors. The four here are the plain gates.

### `LF-DISPUTE` — active dispute *(G3)*

> **An active dispute is the first thing to settle, before anything else in this Report.**
>
> A franchise agreement grants rights you must be certain you hold. While ownership of the brand or the system is contested, every right you grant sits on the outcome of that dispute — and a partner who signs during it inherits your risk without having priced it. Nothing else here is wrong because of this. It simply cannot proceed around it.

### `LF-NO-ENTITY` — entity structure *(G4)*

> **Your business entity is not currently structured to grant a franchise, and that comes before the rest of this Report.**
>
> A franchise agreement grants rights the signing entity has to actually hold: the brand, the system, the right to license both and to define a territory. If the entity cannot grant them, the agreement is unenforceable in the part that matters most. **Partner conversations can be held, but they cannot be closed** — and a partner who signs against a structure you later change has grounds to revisit everything.

### `LF-LICENCES` — statutory licences *(G5)*

> **The licensing position needs resolving before a partner is signed, and it leads this Report because it sets their opening date, not yours.**
>
> You answered no to whether your licences are current and could be obtained again in a new location. That answer covers two very different problems — something lapsed here, or not yet knowing what a new location would require — and only one of them is urgent. Whichever it is, **a partner's launch is set by whichever permission takes longest**, and an unknown at this stage becomes their delay and your reputation.

### `LF-TRADEMARK` — no registered trademark *(G1)*

> **You do not yet hold a registered trademark, and that is the first thing to fix.**
>
> The brand is the main thing a franchisee is paying for. Without registration you cannot reliably stop someone else using the name — including, eventually, a former partner — and you are licensing something your own claim to is incomplete. **Registration takes months rather than weeks**, which is why it leads: started now it runs alongside everything else, and started later it holds up a signing.

### `LF-AGREEMENT` — no agreement template *(G2)*

> **You do not yet have a franchise agreement, and the first partner conversation will reach that point faster than you expect.**
>
> An agreement drafted in a hurry around one eager partner becomes the template every later partner negotiates against, and the terms you concede under time pressure are the ones you live with across the network. **The cost of writing it early is a few weeks. The cost of writing it late is a precedent.**

**`LF-LICENCES` is written for `G5 == No` only.** `G5` also offers **Partial**, which is a different finding and does not lead — it goes to Section 05 under `I-NN-G5-PARTIAL` *(§4.3)*. The same holds for `G2`.

**`LF-TRADEMARK` fires on `Neither`, not on an application filed.** `G1`'s three values are Registered · Application filed · Neither *(spec §7)*; a filed application is a weaker position, not an absent one, and it is reported in Section 05 rather than led with.

## 1.3 Gap-led leads — twenty-one blocks

**Keyed `I-LEAD-{PILLAR}-{SEVERITY}`.** Each opens with the finding named plainly, then says why it leads.

> **Reviewed by Ronak Patel, 20 October 2026.** Five blocks kept as written; sixteen revised. Eight became more direct, one was softened, and seven were rewritten around a point he raised from his own franchising experience. **His notes are recorded against the blocks they changed**, so a later reader can see why the wording is what it is.

### Profit & Payback *(UE, 20%)*

| Severity | Block |
|---|---|
| **Major** | **Your numbers do not leave enough for both a franchisee's return and your fee, and until they do, this does not work as a franchise.** A partner runs the same model from one outlet, without your buying power, and pays your fee and royalty from what is left. At your current margin there is not enough left to divide. **No other strength in this Report makes up for that**: an opportunity that does not pay a partner does not get signed. |
| **Moderate** | **Your economics work for an outlet you own. They have not yet been tested for one that pays you, over the full term of a franchise.** That is the largest unknown in this Report. The business is profitable, which puts you ahead of most brands at this stage. But a franchisee's return is a different calculation from yours. He pays a fee and a royalty and market rent, not the rent you negotiated years ago, and his numbers have to hold across nine years of rising rents and salaries, not only at today's costs. **Most founders model on their own current figures, and that is usually where scaling stalls.** It leads because it decides your fee and your royalty, and those decide everything downstream. |
| **Minor** | **Your economics hold. Payback sits towards the longer end of comparable formats, and it is likely to be the first thing you are asked about.** That is not a weakness in itself. But investors compare, and once the total investment is within their reach, **payback is the number that separates one brand from another**. So the rest of the offer will need to make a clear case for itself. |

*Ronak on Moderate: "Calculate viability not just at current OPEX but for the next 9 years, with inflation in rent and salaries. Most founders don't work on viability with market rentals; they use conservative numbers, which becomes a bottleneck while scaling."*
*The promise this creates is honoured: **Tier 3's model extends to nine years at market rent**, rent stepping 15% every three years and salaries at a flat 10% a year, stating the years of trading it projects from (T88, T89 · 20 October). **Its headline output is the revenue growth a partner needs** — at a flat 10% wage rise, revenue must grow 10% a year or labour takes the margin. `UE-MOD` stands as written.*
*Minor was softened and ordered to match approved `C-UE-B3` — total investment first, then payback.*

### Systems *(OR, 20%)*

| Severity | Block |
|---|---|
| **Major** | **Too much of this business runs on what your people know rather than what is written down, and that is what breaks first in a network.** A franchisee cannot learn it by working alongside your team: he is in another city, with staff you did not hire. **What is not documented does not travel.** The damage shows not at launch but about three months in, as drift nobody can trace. |
| **Moderate** | **Routine operations are documented; the decisions that need judgement are not, and that is exactly where consistency breaks.** The ordinary day is covered. On the unusual day a partner improvises, and improvisation is how two outlets stop being the same business. **It leads because the knowledge already exists in your team** and has not yet been captured in writing. |
| **Minor** | **Your documentation is substantially complete, with specific gaps that each partner would otherwise fill their own way.** SOPs change as a business learns, and across several outlets they change often. **Documentation compiled as one manual is the hardest kind to keep current**, because each department's update waits on the whole document and partners end up working from different versions. Gaps at this level are invisible at one or two outlets. By the fourth, each outlet has solved them differently. |

*Ronak on Minor: "As you scale, SOPs change with learnings, which is why systems should be broken down by department rather than compiled as one document."*
*Moderate lost the phrase "the cheapest thing in this Report to fix" — see §1.5.*

### Support *(SI, 15%)*

| Severity | Block |
|---|---|
| **Major** | **There is no defined support structure, and that is the finding most likely to sour your first partnership.** Partners form expectations from what they were told during the sale, and the gap between that and what actually arrives is where most franchise relationships go wrong. **Undefined support does not read as flexible — it reads as absent**, and the argument happens six months after the money has changed hands. |
| **Moderate** | **Support exists but is not written down, so it is being promised differently in every sales conversation.** Whatever is not specified is described from memory, generously, by whoever is selling. **It leads because those promises are being made now**, and each one is a precedent you will be held to. |
| **Minor** | **Your support model is defined, but who owns each part of it, and how much time they give it, is not.** This is common: to keep operating costs down, support is added to people who already have other jobs, without defined KRAs. It works for one partner. At the second and third, the undefined parts are the ones that get skipped, and **the load drifts back to the founder at exactly the point his attention should be on expansion.** |

*Ronak on Minor: "A support team with defined KRAs is crucial. Most founders keep operating cost low by giving people multiple responsibilities without defined KRAs; it compounds as you scale and takes your focus off expansion."*

### Your Role *(FL, 15%)*

| Severity | Block |
|---|---|
| **Major** | **The business still depends on you personally, and that is the finding that most limits what can be franchised.** What a partner buys is a business that runs without its founder — if the customer experience changes when you are not in the building, what you have is a skilled operator's business rather than a format. **This is the most common reason a profitable brand cannot franchise**, and it is not about effort. It is about what has been built into the system versus what lives in you. |
| **Moderate** | **The business runs without you for short periods, but not reliably, and that boundary is where a franchise offer is tested.** A partner needs a version that works in your absence by default, not by arrangement. **The founder's role has to change as the network grows: what you handle personally at five outlets becomes the bottleneck at ten.** It leads because this takes longest of anything in this Report. Handing over judgement is measured in months of someone else deciding while you watch. |
| **Minor** | **The business largely runs without you, but specific decisions still come to you, and they are usually the ones that matter most.** A partner cannot route those decisions to you. **Each one becomes a point where his judgement replaces yours.** |

*Ronak on Moderate: "A founder has to keep evolving. Doing the same thing at 10 outlets as at 5 creates a bottleneck, because you end up handling every requirement."*

### Market Proof *(MR, 12%)*

| Severity | Block |
|---|---|
| **Major** | **There is not yet evidence that this works beyond its current location, and that is what a partner is actually buying.** One outlet cannot show how much of its success belongs to the format and how much to the site, the city or you, and the dynamics change at every location. **Until you have run at least two outlets yourself, you cannot know your own success rate, and a partner cannot either.** Until then, the offer rests on your word. |
| **Moderate** | **The evidence that this format travels is thin, and it will decide who signs and on what terms.** You have more than one data point, but not yet a pattern. **A partner who cannot verify the format carries the risk himself, and he will want that reflected in the price.** That is why it leads. |
| **Minor** | **Market evidence is solid, with gaps in the specific formats or locations a partner will ask about.** Investors arrive with questions, and they ask hardest where the evidence is thinnest. **A brand that has not looked at its own offer from the investor's side finds these gaps in the meeting rather than before it.** |

*Ronak on Major: "Market proof cannot be measured by one outlet. Until a founder has run at least two outlets himself, even he cannot understand the success rate, because the dynamics change at every location."*
*Ronak on Minor: "A founder must be prepared for every question a franchise partner may ask: put yourself in the investor's shoes and prepare your FAQ."*
*The two-outlet threshold was checked against the scoring on 20 October: `C-MR` Band 1 is "one place and not yet beyond it" and Band 2 begins at a second outlet. **It agrees.***

### Brand Pull *(BP, 10%)*

| Severity | Block |
|---|---|
| **Major** | **The brand does not yet pull on its own, and that removes the main reason to buy a franchise rather than start independently.** Franchise investors are drawn to brands they have already discovered in the region they want to invest in, and in a market where every category has competition, an unknown name is one option among many. A franchisee pays a fee for demand he would not otherwise have. Without recognition he is paying for an operating system: a different offer, at a different price. **Visibility the brand has not invested in itself is visibility no partner will build for it.** |
| **Moderate** | **The brand has local recognition that has not been tested outside its own area.** This is the finding that most affects where you expand rather than whether you should. **Pull is geographic before it is general**, and a partner in a city where nobody has heard of you is launching a new brand with your manual. |
| **Minor** | **The brand pulls better than you can currently show.** What a partner can verify, such as reviews, coverage and enquiry records, is weaker than what is actually true. **It is a record-keeping gap, and it is yours to close.** |

*Ronak on Major: "Only once the brand is discovered in the region you want to franchise in will you attract franchise investors. Every business has competition, and if the founder doesn't invest in his own brand's visibility, no one else will."*

### Right Partner *(PP, 8%)*

| Severity | Block |
|---|---|
| **Major** | **There is no defined partner profile, and that is the finding most likely to produce a first franchisee you regret.** With no written profile and no selection process, the first partner is chosen in a conversation and the deal agreed in the room — **and every partner afterwards is recruited against whatever that one turned out to be.** The first signature sets the standard, whether or not anyone intended it to. |
| **Moderate** | **You know the partner you want, but it is not written down and there is no way to test for it.** Intent held in your head does not survive an enthusiastic candidate with money. **It leads because it is the cheapest thing in this Report to put right and the most expensive to get wrong**: exiting a bad partner costs more than every other item here combined. |
| **Minor** | **Your partner criteria are defined, with the selection process still informal.** Minor while you are choosing one partner and significant at five, when the process is what keeps the fifth as good as the first. |

---

## 1.5 One "cheapest" claim, not two

**`I-LEAD-PP-MOD` keeps "the cheapest thing in this Report to put right and the most expensive to get wrong".** It is the sharpest line in the set and the pairing is the point.

**So `I-NN-G4-DK` gives the claim up** *(Ronak, open check 4)*. Both can appear in one Report, and they were not merely similar — they were the same construction twice. Ronak had already cut a third instance from `I-LEAD-OR-MOD`, which is what exposed the pattern.

## 1.4 When nothing is wrong

### `I-LEAD-STRONG`

> **There is no single thing holding you back, which is an unusual result and worth saying plainly.**
>
> Every area scores above the level where this Report would name a gap, and nothing in your answers raises a legal or structural blocker. **That is not a verdict that franchising will work** — this Report measures whether a business can be reproduced, not whether a market wants more of it. What it does mean is that the groundwork is done, and the next questions are commercial rather than structural.

**This block exists because without it the strongest possible result has no opening section**, and a Report that begins at Section 03 reads as though something failed to load.

---

# 2. Section 02 — where else your answers disagree

**One detector set, not two.** v1.2 ran `I-CONTRA-*` notes alongside the spec's `LF-*` detectors, and they overlapped. **Two of the four notes were strict subsets of a detector** — forbidden by the spec's §4.3, and the founder would have read the same finding twice.

| v1.2 note | Relationship | v1.3 |
|---|---|---|
| `I-CONTRA-UE` | **Strict subset** of `LF-MONEY-DISAGREE` — `UE8 = 1` satisfies `UE8 <= 2`, and "above 15%" *is* `UE7 >= 4` | **Retired.** The detector covers it |
| `I-CONTRA-FL` | **Strict subset** of `LF-RATED-NOT-RUN` — `FL4 = 5` satisfies `FL4 >= 4`, `FL5 = 0` satisfies `FL5 <= 2` | **Retired.** The detector covers it |
| `I-CONTRA-MARGIN` | No detector covers it | **Promoted** to `LF-TWO-MARGINS`, priority 96 |
| `I-CONTRA-BP` | No detector covers it | **Promoted** to `LF-THIN-BASE`, priority 72 |

**Ronak approved all four notes and sharpening for two of the detectors that replace them.** Where both existed, the sharpened detector wins — that is what he asked for. **No approved text is lost: the two promoted notes keep their wording**, which he approved unchanged.

**Section 02 now renders every detector that fired and did not lead**, up to four, in priority order *(spec §5)* — and the legal detectors go to Section 05 instead *(§1.1)*.

## 2.1 The nine contradiction detectors

**`Tier2-Platform-Build-Spec.md` §4.2 assigns the heading and body to Ronak.** His rulings of 20 October are applied: four kept, three sharpened, two promoted from the notes he had already approved.

**The rule that governs all nine** *(§4.3)*: **a contradiction is reported, never resolved.** The Report says the answers disagree and offers the most likely explanation. It does not decide which answer is false — that needs figures Tier 2 did not ask for.

**And none of them instructs.** Three drafts told the founder what to do; P6 forbids it and the lines are recast as positions. **Ronak approved the strength, which is unchanged — only the grammar moved.**

### `LF-FEE-ON-SAND` — priority 102 · `warn` · *approved, advice line recast*

> **You have set a fee and a royalty on numbers that do not yet agree with each other.**
>
> You reported a healthy outlet margin. You also told us the company is at or below breakeven, or that it has depended on your own money to operate. Both can be true at once — it is what happens when overhead or expansion spending outruns what the outlets earn.
>
> **What makes this the first finding is the third answer: the fee and royalty are already decided.** A partner's return is calculated from the margin left after he pays them. If the two figures behind that margin disagree, the fee has been set against a number nobody has settled.
>
> We are not telling you which figure is wrong. We are telling you that a price has been fixed on top of them, and that a franchisee's offer, your revenue model and every conversation you have already had rest on it.
>
> **This is the only finding in this Report that is already in the market.** The others describe a position. This one describes a price other people have been quoted.

### `LF-MONEY-DISAGREE` — priority 100 · `warn` · *sharpened*

> **Your outlet margin and your company position do not agree, and a partner will be priced off one of them.**
>
> You reported a healthy margin at outlet level, and told us the company is at or below breakeven, or has needed your own money to keep running.
>
> **A franchisee operates a single outlet with no head office above him, so which of those two numbers describes his reality is not a detail — it is the whole offer.** If the outlet figure holds, his economics may be better than yours. If the company figure is the truer reflection of what an outlet costs to run once everything is counted, his will be worse, and he will discover it in his second year rather than his first.
>
> **No fee has been set yet, which means nothing is committed.** The price will come from one of these two numbers, and they do not currently agree.

### `LF-TWO-MARGINS` — priority 96 · `warn` · *promoted from `I-CONTRA-MARGIN`, approved wording*

> **Your company margin and your outlet margin are the same figure.**
>
> In the free Audit you gave a band for what one outlet earns. Here you gave a number for what the whole company earns after head office costs and your own salary. **For almost every brand the second is lower than the first** — the gap between them is what it costs to run the business above outlet level.
>
> Where they match, either the overhead genuinely is negligible, which is worth knowing, or one of the two questions was answered with the other one's number.
>
> **This is the single most consequential figure in the Report.**

### `LF-RATED-NOT-RUN` — priority 92 · `mile` · *sharpened*

> **You rated the business as unchanged in your absence, and it has not been absent from you.**
>
> You said the customer experience is indistinguishable whether or not you are in the building. You also said there were few or no days in the last ninety when the business operated without you present or on call.
>
> **That rating is an opinion, not a measurement.** Nothing has tested it, and the founder is the one person who cannot observe what changes when he leaves — the staff behave differently because he is there, and he has never seen the version where he is not.
>
> **A partner is buying the untested version.** What he needs is a stretch of days where the business ran without you and the result was recorded, and that evidence does not exist yet.

### `LF-SYSTEM-UNCHECKED` — priority 88 · `warn` · *approved*

> **Your procedures are written down and nothing confirms they are followed.**
>
> You told us operations are documented to the highest level this assessment measures. You also told us there is no defined quality check — no checklist, no audit, no mystery-shop routine that someone other than you could run.
>
> **Documentation without verification describes intent rather than practice.** In an outlet you are in, that gap closes by itself: you see what is happening. In an outlet you are not in, nothing closes it.
>
> **This is the pairing that decides whether documentation travels.** A manual tells a franchisee what to do; a check is what tells you whether he did. Networks lose consistency at the second of those, not the first.

### `LF-SUPPLY-OVERRATED` — priority 80 · `mile` · *approved*

> **You rated your supply chain as ready to serve outlets you do not own, from a single outlet with no standardised systems.**
>
> You told us the supply chain could serve an outlet elsewhere, run by someone else. You also told us the business operates one outlet, and that your POS, inventory and tech could not be handed over and run the same way.
>
> **A supply chain that has only ever served one location it owns has not been tested in the way that rating implies.** Serving a second site, in another city, run by someone with different buying habits, is a different operation — and the systems that would coordinate it are the ones you told us are not transferable.
>
> **This does not say the rating is wrong.** It says the evidence for it does not exist yet, and a partner conducting diligence will ask for that evidence first.

### `LF-UNMEASURED` — priority 78 · `warn` · *new, 20 October*

> **The largest gap in this Report is not in the business. It is in what the business measures.**
>
> You answered *I don't know* to {n} questions. Each is a reasonable answer on its own, and together they describe something a partner will notice before he notices anything else.
>
> **A franchisee is not only buying a format. He is buying your judgement about it**, and judgement that cannot be evidenced is indistinguishable from a guess to someone who has not met you. The same is true of a bank.
>
> **This is why it leads rather than the score.** The score is built from what you did tell us, and it is as reliable as that subset allows. Where the figures are missing, neither of us knows what the number would have been.

**`T44` created this finding and no detector carried it.** *"Three or more 'I don't know' answers in one submission → the Report leads with that. His largest gap is not operations, it is measurement."* **Written into the rules in October and never into a block** *(developer, 20 October)*.

**It sits at 78** — above the two softest contradictions, below the money findings and the blockers. A founder who cannot state his own figures has a real problem; a founder whose fee is priced on figures that disagree has a worse one.

### `LF-DEMAND-UNREAD` — priority 74 · `ok` · *approved, advice line recast*

> **You track the data that would prove demand, and told us demand is not data-backed.**
>
> You said footfall or customer count is tracked systematically across outlets. You also said customer demand is mostly anecdotal rather than validated.
>
> **This is the one contradiction in this Report likely to be in your favour.** The evidence appears to exist and is not being read as evidence — which usually means it is collected for operational reasons and never looked at as proof of anything.
>
> **Demand shown in numbers is the cheapest credibility available to a brand your size, and the figures suggest you already hold it.**

### `LF-THIN-BASE` — priority 72 · `mile` · *promoted from `I-CONTRA-BP`, approved wording*

> **A {rating} rating from {n} reviews is unusually strong for that volume.**
>
> At under twenty-five reviews a rating moves on a single opinion, so the figure may be accurate and still not yet be evidence.
>
> **A partner, or a lender, will read a high rating on a thin base as promising rather than proven.**

### `LF-PAPER-NO-ENTITY` — priority 115 · `warn` · *sharpened*

> **You have a franchise agreement and not an entity that can sign it.**
>
> You told us a franchise agreement template exists. You also told us the business entity is not structured in a way that can legally support franchising.
>
> **An agreement is only as good as the party granting the rights.** The document can be word-perfect: if the entity signing it cannot hold the brand, the system and the right to license both, **the grant fails in exactly the clause a dispute would turn on — and any agreement signed in this position is open to challenge by the partner who signed it.**
>
> **This pairing is more dangerous than either answer alone, because the paperwork is what makes a founder feel ready.** The agreement is the visible artefact and the entity is the invisible one. Conversations move faster once there is a document to send, and the thing that would stop them is the thing nobody is looking at.

### `LF-NO-CONTRADICTION` — priority 10

**No prose.** Nothing contradicted, so Section 01 takes the costliest ranked gap at its severity from **§1.3**. **It fires more often than any other detector.**

## 2.2 Where the advice went

**Three drafts instructed the founder.** P6 reserves that for Tier 3, and Ronak approved their *strength*, not a licence to prescribe. Each is now a statement of position carrying the same weight:

| Detector | Was | Now |
|---|---|---|
| `LF-FEE-ON-SAND` | "the finding to resolve before the next partner conversation" | "the only finding in this Report that is already in the market" |
| `LF-MONEY-DISAGREE` | "it should be set from whichever of these two figures survives scrutiny" | "the price will come from one of these two numbers, and they do not currently agree" |
| `LF-DEMAND-UNREAD` | "worth resolving before you talk to partners" | "the figures suggest you already hold it" |

**None is softer.** A statement of where a founder stands is harder to argue with than an instruction, which he can simply decline.

# 3. Section 03 — against your free result

**Always present** *(Report library §5)*. It is the only place the Audit's range appears, and it appears as history.

## 3.1 Four sentences, all assembled

**Nothing here is written per brand.** The section is four frames filled from values the engine already holds.

| Key | Frame |
|---|---|
| `I-CMP-RANGE` | Your Audit range was **{low} to {high}**, built from eleven questions. All **{n_total}** place you at **{overall}** — {position}. |
| `I-CMP-DOWN` | {n_down} answers moved it down: {list_down}. |
| `I-CMP-DOWN-ONE` | One answer moved it down: {list_down}. |

**Every counted string needs a singular** *(T124, developer, 21 October)*. Without one the Report prints *"One more places"*, *"One answers moved it down"* and *"1 items"* — **three different ways of looking careless in the most-read parts of the page.**

| Counted string | At `n = 1` |
|---|---|
| `I-CMP-UP` / `-DOWN` | `I-CMP-UP-ONE` / `I-CMP-DOWN-ONE` |
| `T2R-02-INTRO` | `T2R-02-INTRO-ONE` |
| The glance tile's `{n} items` | **`1 item`** — the numeral stays, the noun loses its `s` *(Report library §5)* |

**At `n = 0` the tile takes `T2R-NOBLOCKERS`** and reads **Nothing**, so no zero-plural case exists *(T101)*.
| `I-CMP-UP` | {n_up} moved it up: {list_up}. |
| `I-CMP-UP-ONE` | One answer moved it up: {list_up}. |
| `I-CMP-BAND` | **On the band.** {overall} sits in the {half} half of {band} — **{above} points above the level below and {below} below {nextband}**. We give you both distances rather than only the flattering one. |
| `I-CMP-BAND-TOP` | **On the band.** {overall} is in **{band}**, the highest level this assessment awards — **{above} points above the level below it.** There is nothing above to climb to. |
| `I-CMP-BAND-BOTTOM` | **On the band.** {overall} is in **{band}**, the lowest level — **{below} points below {nextband}.** |

**`{n_total}` is computed, never a literal.** `CANONICAL-VALUES.md` §8: Tier 2 is **up to 35 questions, 32 for a single-outlet brand, plus all 11 carried** — so the total runs 43 to 46 depending on the brand. **"Forty-five" in v1.3 and "forty-four" in `E1` were both wrong**, and §8 says plainly: *never state a fixed Tier 2 question count in public copy.* Found by the developer, 20 October.

### `{position}` — three variants

| Condition | Text |
|---|---|
| `low <= overall <= high` | inside that range, {where} |
| `overall > high` | **above that range** |
| `overall < low` | **below that range** |

`{where}`: `a little below its midpoint` · `close to its midpoint` · `a little above its midpoint` · `near the top of it` · `near the bottom of it`, by where `overall` falls across the band's fifths.

**Three variants, not one.** `I-CMP-BAND` assumes a band above and below. **`Ready to Scale` has nothing above it and `Not Yet Ready` nothing below**, and the general frame would have printed a distance to a band that does not exist *(developer, 20 October)*.

### `{half}`

`upper` when `overall` is above the midpoint of its band, `lower` otherwise.

## 3.2 Which answers get named — the spec's rule, not mine

**`Tier2-Platform-Build-Spec.md` §6 settles this and supersedes v1.0.** I had said "every answer scoring 1, every answer scoring 5, four each". **The spec ranks instead:**

> Rank every Tier 2 answer by **`weight × (value − 3)`** — how far it pulled the pillar from the middle, scaled by the pillar's weight — and **name the top three in each direction.**

**It is the better rule and the reason is weighting.** Mine treated a 1 on Right Partner, at 8%, as equal to a 1 on Profit & Payback at 20%. The spec's ranks by how much the answer actually moved the score, which is what the section claims to explain.

**It also names 2s and 4s when they outrank a 1 on a light pillar** — correctly, because they did more to the number.

| | |
|---|---|
| **Rank by** | `weight × (value − 3)` |
| **Moved it down** | The three most negative |
| **Moved it up** | The three most positive |
| **Named as** | The answer label from §5, lower-cased, joined with commas and a final "and" |

**Both frames stay conditional.** A brand with nothing below the middle loses `I-CMP-DOWN` entirely — no "nothing moved it down", which would read as a scolding for the best possible case.

## 3.3 Why both distances

**`I-CMP-BAND` always gives the distance to the band below as well as the band above.** This is wider than the spec's R24, which requires the margin to be stated only when the score lands within one point of a boundary. **Always stating both satisfies R24 and more**, and avoids a rule that fires rarely and is therefore never tested. A founder two points from the next band up will hear only that; one who is nine points above the band below should hear that too, because it is the more useful fact about how secure his position is. **Reporting only the flattering distance is the kind of small dishonesty that costs a document its authority.**

---

# 4. Section 05 — the five non-negotiables

**All five gates now have Report text.** Group A's `A5` covers `G1` and `G3` for the free Audit's result page, where the gate caps the band — **wrong for a Report**, where neither touches the Tier 2 band. §4.0 replaces them; §4.1–4.3 cover the three Report-only gates.

**Every gate appears in Section 05, including the clean ones**, and **every row carries its title and a sentence** — see §4.5 for the three states and §4.6 for the Clear blocks *(T103)*.

**v1.3 said a clean gate "produces no entry" and that was wrong** — `E4`, the approved sample and `T2R-CLEAR` itself all list clean gates *(developer, 20 October)*. **Five gates shown as checked, four Clear and one Must resolve, is far more useful than a section listing one item**, and for a wholly clean brand five Clears is a strong page rather than an absent one.

**The consequence, stated plainly: Section 05 never disappears.** `Content-Library-Tier2-Report.md` §4 lists it as a section that can vanish, and that is now true only of Section 02. **The glance strip's fourth tile still reads `Must resolve — Nothing`** for a clean brand, which is consistent: the tile counts problems, the section lists checks.

**Each problem gate has two blocks: "No", and "I don't know".** **The two are never merged** — not knowing is a different finding from knowing the answer is bad, and for a brand about to take money from a partner it is sometimes the worse one.

## 4.1 `G2` — franchise agreement template

### `I-NN-G2-NO`

> **There is no franchise agreement, even in draft.**
>
> The first serious partner conversation reaches this point faster than most founders expect, and an agreement drafted around one eager candidate becomes the template every later partner negotiates against. **The terms conceded under time pressure are the ones that persist across the network.** This is not a blocker to conversations. It is a blocker to closing one safely.

### `I-NN-G2-DK`

> **You were not able to say whether a franchise agreement template exists.**
>
> That usually means one was drafted at some point and nobody is certain what it says or whether it is current. **An agreement whose terms you cannot state is an agreement you cannot negotiate from**, and the first time anyone reads it closely should not be across a table from a partner.

## 4.2 `G4` — entity structure

### `I-NN-G4-NO`

> **The business entity is not structured to support franchising.**
>
> A franchise agreement grants rights the signing entity has to actually hold: the brand, the system, the right to license both and to define a territory. If the entity cannot grant them, the agreement is unenforceable in exactly the part that matters. **Until this is settled, partner conversations can be held but cannot be closed** — and a partner who signs against a structure that is later changed has grounds to revisit everything.

### `I-NN-G4-DK`

> **You were not able to confirm whether the entity can legally support franchising.**
>
> This is a question with a definite answer that someone can establish in an afternoon, and it sits underneath every agreement you will sign. **An unverified entity structure is the one item here that can invalidate an agreement after it has been signed.**

## 4.3 `G5` — statutory licences

### `I-NN-G5-NO`

> **Your statutory licences are not current, or could not be obtained again in a new location.**
>
> That single answer covers two very different problems — something lapsed here, or a new location facing a requirement you cannot yet meet — and only one is urgent. **Whichever it is, a partner's launch date is set by whichever permission takes longest.** An unknown at this stage becomes their delay and your reputation.

### `I-NN-G5-DK`

> **You were not able to say whether your licences are current and replicable.**
>
> For a single owned outlet this is manageable, because you would find out when it mattered. **For a partner opening in a city you have never operated in, finding out when it matters is the problem** — their capital is committed and their opening date is already promised.

## 4.0 `G1` and `G3` — Report text, not the Audit's

**Group A's `A5` covers trademark and active dispute and was written for the free Audit's result page**, where the gate *caps the band* — "this result is capped…". **In a Report that sentence is wrong**: `G1` and `G3` do not touch the Tier 2 band *(spec §7)*, and the Report is not a capped result. Flagged by the developer, 17 October.

### `I-NN-G1-NEITHER`

> **No trademark is registered or filed.**
>
> The brand is the main thing a franchisee pays for. Without registration you cannot reliably stop someone else using the name — including, in time, a former partner — and you are licensing something your own claim to is incomplete. **Registration runs in months rather than weeks**, which is why its absence shows up as a delay to a signing rather than a problem with the business.

### `I-NN-G1-FILED`

> **A trademark application is filed and not yet registered.**
>
> This is a materially different position from having none, and worth stating as such: the claim is lodged and dated. **What it does not yet give you is the right to stop someone else using the name**, and a partner's lawyer will ask when registration is expected before relying on it.

### `I-NN-G3-YES`

> **There is an active dispute over the brand or the business.**
>
> A franchise agreement grants rights you must be certain you hold. **While ownership is contested, every right you grant rests on the outcome** — and a partner who signs during a dispute inherits a risk he has not priced. Nothing else in this Report is wrong because of this. It is simply the one item that cannot be worked around.

**`I-NN-G3-YES` almost never appears here**, because an active dispute leads Section 01 at priority 120 *(§1.1)*. It exists for the case where something higher is impossible — there is nothing higher — and so that Section 05 is complete if the lead is ever suppressed.

## 4.3b `Partial` — the answer neither v1.0 nor the spec wrote

**`G2` and `G5` offer Yes · Partial · No** *(spec §7)*. v1.0 wrote "No" and "I don't know" and missed Partial entirely, so a Partial answer would have produced nothing at all.

**Partial is not clean and does not lead.** It goes to Section 05 as its own finding.

### `I-NN-G2-PARTIAL`

> **A franchise agreement exists in part.**
>
> A partial agreement is usually a document drafted for something else — a distributor, a licensee, a single early partner — being carried forward because it is what exists. **The clauses a franchise turns on are the ones most often absent from it:** territory, term, renewal, transfer, what happens when it ends. Worth knowing which of those your draft already answers before a partner's lawyer finds out for you.

### `I-NN-G5-PARTIAL`

> **Some of your statutory licences are current and replicable, and some are not.**
>
> This is the most common answer to this question and the least useful to leave as it is. **A partner's opening date is set by whichever permission takes longest**, so a position that is mostly fine is only as good as its slowest item. Which licence is the laggard is the thing to establish, and it is a question with a definite answer.

**`G1` has three values too** — Registered · Application filed · Neither. **An application filed is reported in Section 05 and does not lead** *(§1.2)*: a pending application is a weaker position, not an absent one.

## 4.4 Rules

**The hardest item leads Section 01** *(§1.2)*, and the rest stay here. **Nothing in this section is ranked or numbered** — each is a gate, and gates do not have an order of importance among themselves once they are all open.

**No block recommends an action** *(P6)*. Each says what the position is and what it prevents.

## 4.5 Three states, not two *(T103)*

**Every gate renders in one of three states.** Two were not enough, and the gap showed up as a straight contradiction between this file and the approved sample.

| Marker | When | Counts toward the glance tile |
|---|---|---|
| `T2R-CLEAR` | The gate is satisfied | **No** |
| `T2R-INPROGRESS` | Real and under way, not finished — a filed trademark, a draft agreement, a `Partial` | **No** |
| `T2R-MUSTRESOLVE` | Absent, lapsed, contested, or unknown | **Yes** |

**The sample called a filed trademark and a draft agreement Clear. This file called them findings. Both were right.** A filed application is not nothing — the claim is lodged and dated — and it is not registration either. **Folding it into Clear hides a real answer; folding it into Must resolve puts it beside "your entity cannot grant the rights it is signing away", which is not the same kind of problem.** A founder reading four must-resolve items where two are genuinely blocking stops trusting the count.

**The state map:**

| Gate | Clear | In progress | Must resolve |
|---|---|---|---|
| `G1` trademark | Registered | Filed, not yet registered → `I-NN-G1-FILED` | Neither → `I-NN-G1-NEITHER` |
| `G2` agreement | Exists and is current | `Partial` → `I-NN-G2-PARTIAL` | No → `I-NN-G2-NO` · Don't know → `I-NN-G2-DK` |
| `G3` dispute | None | — | Active → `I-NN-G3-YES` |
| `G4` entity | Structured for franchising | — | No → `I-NN-G4-NO` · Don't know → `I-NN-G4-DK` |
| `G5` licences | Current and replicable | `Partial` → `I-NN-G5-PARTIAL` | No → `I-NN-G5-NO` · Don't know → `I-NN-G5-DK` |

**`G3` and `G4` have no middle state.** A dispute either exists or does not; an entity either can grant the rights or cannot. **Inventing a middle for them would be symmetry for its own sake.**

**Consequence for the sample:** Chai Junction's trademark and agreement rows move from Clear to In progress, carrying `I-NN-G1-FILED` and `I-NN-G2-PARTIAL`. **The fourth tile still reads 2 items** — the entity and the licences, unchanged — so the glance strip does not move. **The sample must be regenerated**, and the change shown to Ronak is two row markers, not new findings.

## 4.6 Every row carries a sentence, Clear included *(T103)*

**§6.5's row titles are for the glance strip's joined caption, not for the section.** A Section 05 row that is only a title reads as a checklist, and the sample's Clear rows have carried a sentence since 12 October — correctly.

**The four Clear blocks below did not exist anywhere.** `I-NN-G3-CLEAR` is the sample's own wording; the rest are written to match it.

### `I-NN-G1-CLEAR`

> **Your trademark is registered.**
>
> The brand is the main thing a franchisee pays for, and you own it outright. **This is the single most common gap in brands at your stage**, and not having it is what turns a signing into a wait.

### `I-NN-G2-CLEAR`

> **A current franchise agreement template exists.**
>
> The terms conversation starts from a document rather than from the first eager candidate. **What is agreed under time pressure with one partner becomes the template every later partner negotiates against**, and you are not exposed to that.

### `I-NN-G3-CLEAR`

> **No active disputes** over brand ownership, IP or an existing partner.
>
> **The most common hard blocker to franchising is not present.**

### `I-NN-G4-CLEAR`

> **The entity is structured to support franchising.**
>
> It can hold and grant what a franchise agreement grants — the brand, the system, the right to license both and to define a territory. **The agreement you sign will be enforceable in the part that matters.**

### `I-NN-G5-CLEAR`

> **Your statutory licences are current and replicable.**
>
> You know what a new location needs and you can obtain it again. **A partner's launch date is set by whichever permission takes longest**, and that date is now yours to plan rather than discover.

## 4.7 The order of the rows *(T103)*

**Must resolve first, then In progress, then Clear. Within each group, `G1` to `G5`.**

**This does not rank the open gates against each other** — §4.4 still holds, and nothing is numbered. It puts what is outstanding where the eye lands, and it means a founder with four Clears does not scroll past them to find the one item that matters.

**Design's v52 boards used the sample's order** (trademark, dispute, agreement, entity, licences), which was the generator's accident rather than a decision. **This rule replaces it.**

## 4.8 The section intro says findings "cap a result". They do not *(T106)*

**The sample's Section 05 intro reads** *"…cap a result regardless of how the seven pillars perform, because they are conditions rather than weaknesses."*

**That sentence was written for the free Audit's result page, where a gate does cap the band.** In a Tier 2 Report it is false: `G1` and `G3` do not touch the band *(spec §7, §4.0 above)*, and the Report prints a computed score that no gate adjusts.

**The intro's second half is already correct** and says the useful thing — *"listed whether or not they affected your band, because each one surfaces during an investor's due diligence."*

| Key | Source | Copy |
|---|---|---|
| `T2R-05-INTRO` | **Lifted** | These are separate from your score because they are not weaknesses to be improved — they are conditions to be met. A business can score well on all seven pillars and still be unable to franchise until these are resolved. They are listed whether or not they affected your band, because each one surfaces during an investor's due diligence. |

**The same error is in Section 03's legal note**, which tells the reader that findings in Section 05 cap a result. **It must be reworded to the same effect or dropped**; it is the only remaining place the Report claims a cap it does not apply.

---

# 5. Section 06 — the "what you told us" labels

**The list under each pillar is where a founder verifies the Report is about him.** Design's rule *(Report library v1.2 §4)*: the question label, then the answer exactly as he saw it, never paraphrased.

## 5.0 The render rule, settled *(T135)*

**The sample has never followed that rule and Design was right to stop.** It prints forty paraphrases joined by `·`, with no labels — *"Output consistent across outlets, with occasional drift"* where the founder chose *"Outlets run to the same written standard."* **Three of those paraphrases were quoting options he did not choose** *(T134)*, and that bug only exists in the paraphrase form.

**The rule stands and the sample changes. Each item renders as:**

> **`{label}`  `{the answer as he saw it}`** — the label in small caps, a space, then the answer. **No `·` between them**; see *How it sets* below.

| Question type | What prints as the answer |
|---|---|
| **Yes / Partial / No**, and other short options | **The option, verbatim** — *Yes*, *Partial*, *No* |
| **Numeric** *(`UE7`, `BP3`, `BP4`, `FL5`, `MR5`)* | **His figure, with its unit** — *9%*, *4.5*, *1,200*, *75 of 90 days*, *3*. **A figure, never a range**: the question takes one number, and a range cannot be checked against a band |
| **Anchored**, the seven of them | **The option's first sentence, verbatim.** Not a summary of it |
| **Carried Tier 1 answers** | The same, prefixed *Audit* as now |

**How it sets.** The label in small caps, a space, then the answer; items joined by ` · `. **Not `label · answer`** — with `·` already separating items, a second one between a label and its answer makes a six-item list read as twelve. The caps carry the distinction instead *(Design, v63)*.

**`FL01`'s answer text is not in any library.** It lives in `fra_scoring_config` as `A1-1`…`A1-5` with second-person restatements, and the engine matches on them *(`FRA-Tier1-Scoring-Specification.md` §51)*. **Take it from there at build time**; the sample shows a representative value and is the one answer the verifier cannot check.

**`verify_sample_answers.py` checks all of this on every build** *(T137)*. Labels against this table, answers against the option its score requires, figures against their bands. **It exists because forty hand-maintained answers drifted three separate times and each was caught by a person reading rather than by a check.**

**Why the first sentence and not the whole option.** The seven anchored options run to 98–116 characters in full and 53–116 for their first sentence, against roughly 50 for today's paraphrases. **A first sentence is still his own words and bounded**; the second sentence of an anchored option is almost always an elaboration of the first.

**This adds no strings to any library.** The labels are below; the answers come from `Tier2-Questionnaire-Strings.md` v1.1, which already holds every option. **The paraphrase form would have needed forty new strings, each able to drift from its option with no mechanical way to catch it** — which is precisely what happened three times before anyone noticed.

**It is checkable.** A rendered answer either is a prefix of the option the founder selected, or it is a bug. **Nothing in the paraphrase form could be tested that way.**

**The answers already exist** in `Tier2-Questionnaire-Strings.md`. **The labels did not.** A question stem is a sentence; a list needs a noun phrase.

**The first nine are the carried Tier 1 answers and were missing entirely** *(T123, developer, 21 October)*. v1.4 wrote labels for Tier 2's questions only — **but Section 06 lists all of a founder's answers, carried and asked, in one place.** Their stems are in `FRA-Tier1-Scoring-Specification.md` §2. **`G1` and `G3` take no label here**: the gates render in Section 05, not in "What you told us".

| Code | Label |
|---|---|
| `UE01` | Outlet payback period |
| `UE02` | Outlet operating margin |
| `OR01` | Written operating procedures |
| `OR02` | Core workflows with an SOP |
| `BP01` | Unprompted franchise enquiries |
| `MR01` | Cities the model is tested in |
| `PP01` | Ideal partner profile |
| `SI01` | Structured training programme |
| `FL01` | Decision-making authority |
| `UE7` | Company EBITDA margin |
| `UE8` | Profitability track record |
| `UE9` | Debt, encumbrances and guarantees |
| `UE12` | Investment ask benchmarked |
| `OR3` | POS, inventory and tech handover |
| `OR6` | Consistency across outlets |
| `OR4` | Defined quality check |
| `OR5` | Supply chain readiness |
| `BP2` | Brand identity manual |
| `BP3` | Average Google rating |
| `BP4` | Total Google reviews |
| `BP5` | Brand promise defined |
| `MR5` | Outlets trading |
| `MR2` | Demand validated by data |
| `MR3` | Site selection criteria |
| `MR4` | City or territory rollout sequence |
| `MR6` | Footfall tracked per outlet |
| `PP2` | Franchisee selection process |
| `PP3` | Territory rights and exclusivity |
| `PP4` | Completeness of the offer |
| `PP5` | Owner-operator or investor-operator |
| `PP6a` | Existing fee and royalty terms |
| `PP6b` | Franchise fee and royalty structure |
| `SI2` | Initial training duration |
| `SI3` | Marketing support capability |
| `SI4` | Named support owner after launch |
| `SI5` | Support capacity beyond the founder |
| `SI6` | Leadership hours in year one |
| `FL5` | Days operating without you |
| `FL2` | Willingness to fix informal process |
| `FL3` | Dependence on personal funds |
| `FL4` | Consistency in your absence |

**Audit answers carried into a pillar are tagged** *(Design, v41)* — the label is prefixed `Audit` in the list, as the sample shows.

**A declined answer is shown as the label and the escape answer the founder saw**, never "not answered" — *"Average Google rating — We don't have a Google listing"*. The list is for verification, and a paraphrase of his own decline is the one thing he cannot verify.

**These labels are also what `I-CMP-DOWN` and `I-CMP-UP` name** *(§3.2)*, lower-cased. One set of words, two places.

---

# 6. The Report's own labels

**The developer's blocker, 17 October: "Without it the Report has no headings."** Every heading, label and marker on the page existed only inside `build_tier2_chai.py` — written there to produce the sample, never lifted into a library. **Same cause as the five content gaps: the sample looked like proof of coverage.**

**These are taken from the approved sample, not invented.**

## 6.1 Section titles

| Key | Copy |
|---|---|
| `T2R-SEC-01` | The one thing we would tell you first |
| `T2R-SEC-02` | Where else your answers disagree |
| `T2R-SEC-03` | How your score is built |
| `T2R-SEC-04` | Your gaps, ranked by what they cost |
| `T2R-SEC-05` | Non-negotiables |
| `T2R-SEC-06` | The seven pillars, in writing |
| `T2R-SEC-07` | Where you sit on the readiness ladder |
| `T2R-SEC-08` | How you compare in your category |
| `T2R-SEC-09` | What this report does not include |
| `T2R-SEC-10` | What comes next |

**The numbers are part of the name** *(Report library §4)*. A Report missing Section 02 runs 01, 03, 04 — it never renumbers.

**These strings are sentence case, and that is the string** *(T104)*. The approved sample sets the page heading in title case — *"How Your Score Is Built"* — and the contents list in sentence case, **from the same words**. Design read that as two different strings and was right to ask. **It is one string with a styling rule**, exactly as `T2R-FINAL`'s uppercase pill is styling and not a second key *(§6.2)*. **The library stores sentence case; the H2 renders title case; the contents list renders as stored.**

## 6.2 Cover and score

| Key | Copy |
|---|---|
| `T2R-SCORE-LABEL` | YOUR FRANCHISE READINESS SCORE |
| `T2R-SCORE-OUTOF` | / 100 |
| `T2R-FINAL` | *Owned by `Content-Library-Tier2-Report.md` §3* — **Final · does not change** |

**`T2R-FINAL` is not redefined here.** v1.3 carried it twice, uppercase in this file and sentence case in the Report library *(developer, 20 October)*. **The Report library owns every `T2R-` key that already exists there; §6 only adds the ones that existed nowhere.** The uppercase in the sample is the pill's styling, not the string.

**The five scale labels**, written out because a key index cannot be built from a range *(T119)*:

| Key | Source | Copy |
|---|---|---|
| `T2R-SCALE-1` | **Lifted** | NOT YET |
| `T2R-SCALE-2` | **Lifted** | EARLY |
| `T2R-SCALE-3` | **Lifted** | ALMOST |
| `T2R-SCALE-4` | **Lifted** | READY |
| `T2R-SCALE-5` | **Lifted** | SCALE |

**v1.4 to v1.11 wrote these as *"`T2R-SCALE-1` to `-5`"* with the five values in a run of prose.** Design keyed all five correctly from it, but **four of them existed nowhere as a key** — the index was right by inference, not by lookup. **A key that can only be reached by reading a sentence is not keyed.**

**These are not the band names.** The bands are Not Yet Ready, Early Stage, Almost Ready, Ready to Plan, Ready to Scale; these are the abbreviations the scale uses because five full names do not fit at 390px. **The badge above the scale carries the full band name**, so both appear and they must not be confused in the build.

## 6.3 The glance strip

`T2R-TILE-SCORE` **Your score** · `T2R-TILE-GAP` **Costliest gap** · `T2R-TILE-BEST` **Strongest pillar** · `T2R-TILE-RESOLVE` **Must resolve**

Values and captions are derived — see the Report library §5.

## 6.4 Within-section labels

| Key | Copy | Where |
|---|---|---|
| `T2R-TOLDUS` | What you told us | Under each pillar in Section 06 |
| `T2R-VSFREE` | Against your free result | The panel in Section 03 |
| `T2R-CLEAR` | Clear | A pillar or gate with nothing outstanding |
| `T2R-INPROGRESS` | In progress | A Section 05 gate that is real but unfinished *(T103)* |
| `T2R-MUSTRESOLVE` | Must resolve | An outstanding Section 05 gate — **these alone feed the glance tile's count** |
| `T2R-LADDER-HERE` | You are here | The founder's rung in Section 07 |

**`T2R-CLEAR` and `T2R-MUSTRESOLVE` are status markers, not headings**, and they appear many times in one Report. They carry no section number.

## 6.5 Section 05 row titles

**The glance strip's must-resolve caption joins these** *(Report library §5: `{Section 05 row titles, joined}`)*. They had no source.

| Gate | Row title |
|---|---|
| `G1` | Your trademark |
| `G2` | Your franchise agreement |
| `G3` | Ownership disputes |
| `G4` | Your business entity |
| `G5` | Your licences |

**Written to read in a joined list** — *"Your business entity and your licences"* — which is why each carries its article. **"Entity, licences" would read as a filing index**, and this line sits in the most-read four inches of the Report.

**`G3` was "The active dispute" and is now "Ownership disputes"** *(T103, Design v52)*. The old title asserted a dispute existed, so a clean brand read **"The active dispute — Clear"**, which is a sentence that contradicts itself. **The new title works in both states** and still joins cleanly: *"Your business entity and ownership disputes"*.

## 6.6 The reviewer block

**One unit with the Section 10 call to action** *(build spec §3, R8)*.

| Key | Source | Copy |
|---|---|---|
| `T2R-BIO-LABEL` | **Lifted** | Who conducts your audit |
| `T2R-BIO-NAME` | **Lifted** | Ronak Patel |
| `T2R-BIO-ROLE` | **Stated** | Founder & CEO, Corporate Culture |
| `T2R-BIO-LINE` | **Approved** | Ronak read this Report and signed it off before it reached you. None goes out automatically. |

**`T2R-BIO-LINE` had rendered nowhere** *(T116)*, and it belongs in the reviewer block, under the role — **which is where Design was already drawing it.**

**The Roadmap card is a different claim and needs its own key** *(T117)*. Its line read *"Reviewed by an analyst before it reaches you"*: **anonymous, and weaker than the named promise Ronak approved.** When I regenerated the sample I replaced it with `T2R-BIO-LINE` — **wrong, and Design caught it by asking whether the line would now appear twice.** The card sits between ₹5,999 and *Start my Roadmap*: it promises the **Roadmap** will be reviewed, in the present tense. `T2R-BIO-LINE` is past tense and about the Report in the reader's hand. **The fault was the anonymity, not the sentence.**

| Key | Source | Copy |
|---|---|---|
| `T2R-CTA-REVIEWED` | **Stated** | Ronak reviews and signs off every Roadmap before it reaches you. None goes out automatically. |

**The two are the same claim across two products and must not be merged.** The card promises the Roadmap; the reviewer block states what happened to this Report. **One each, never both in one place.**

**`O6` is closed** *(T110)*. **Ronak Patel is Founder & CEO of Corporate Culture**, confirmed by Sakthikkumaran on 20 October. It prints under the name, above the blurb.

**Two things went wrong before it got there, both mine.** v1.3 **invented** *"Head of Franchising, Corporate Culture"*. v1.5 reverted it and **invented a source for the correction as well** — *"the pitch deck says Founder & CEO"* — which appears in no pitch deck, no project document and no generator. **The title happened to be right; the sourcing was fabricated**, and it was repeated as fact four times before anyone checked.

**`T2R-BIO-LABEL` had never been recorded.** The generator prints *"Who conducts your audit"* above the name, and the library listed the name and the role without the line that introduces them.

**`T2R-BIO-LINE` is the same claim as `T2L-REVIEWER-LINE`, `T2HP-AFTER-REVIEW` and `T2S-REVIEWER`** *(T39, T61)*. **The wording may differ to suit the surface; the claim may not** — he reads and signs off every Report, and none goes out automatically.

**The credentials stay, and v1.6 was wrong to say otherwise** *(T108)*. That line read *"the credentials are not repeated here — by Section 10 a founder has read nine sections of his reviewer's judgement."* **It is a nice sentence and it is wrong about the moment.** Section 10 is not the end of a biography; **it is where a founder decides whether to pay ₹7,079**, and it is the one place on the Report where track record is the argument. The approved sample shows all four, and Design's boards followed it. **I asserted a preference over a rendered, approved page.**

| Key | Copy |
|---|---|
| `T2R-BIO-BLURB` | Corporate Culture has worked with consumer brands across F&B, retail, lifestyle, wellness and education — helping them scale with structure, funding access and long-term expansion clarity. The seven-pillar framework behind this assessment comes from those engagements, and every report is reviewed personally by Ronak. |
| `T2R-STAT-1` | **₹100+ Cr** · Investments facilitated |
| `T2R-STAT-2` | **500+** · Franchise deals |
| `T2R-STAT-3` | **50+** · Brands scaled |
| `T2R-STAT-4` | **20+** · Years of expertise |

**The four figures are confirmed as printed** *(Ronak, 20 October · T111)*. **The company profile deck says 400+ franchise deals and 100+ brands scaled and now disagrees with the Report on both** — fewer deals, twice the brands. **The Report's figures are the official ones; the profile deck is out of date** and is Sakthikkumaran's to correct *(`O16b`)*. The pitch deck does not carry these figures and is unaffected.

**All five are Lifted** from `build_tier2_chai.py`.

## 6.7 Section intros, headers and footnotes

**The fourth batch of the same fault**, and **my provenance claim about it was false** *(T105)*. v1.5 said every line here was lifted unchanged from `build_tier2_chai.py`. **Design checked against the sample PDF and could not find most of them. It was right: ten of the sixteen are not in the generator at all, and two of the six that are I had quietly edited.**

**Each key below says where it came from.** `Lifted` means the string is in the generator byte for byte. `Authored` meant I wrote it and nothing had rendered it. **All six Authored strings were read by Ronak on 20 October and are now `Approved`** *(T111)* — one changed, five kept. **No string on Screen 6 is unread.**

| Was | Now |
|---|---|
| `T2R-03-INTRO` *"Seven **areas**, each weighted…"* | **`T2R-03-INTRO` is the generator's line: "Seven pillars, each weighted…"** — I had changed the house word. **The Report says pillars everywhere**, including Section 06's own title, so "areas" contradicted a heading two lines away |
| `T2R-TH-AREA` = *Area* | **`T2R-TH-PILLAR` = Pillar.** The generator's table header, and the same correction |
| `T2R-HARDSTOP` in capitals | **Sentence case: *Must resolve — hardest stop in this report*.** The generator's string; the capitals are the badge's styling, the `T2R-FINAL` error repeated |
| `T2R-DISCLAIMER` | **Rewritten to the footer the sample actually prints** |

| Key | Source | Copy |
|---|---|---|
| `T2R-01-INTRO` | **Lifted** | Everything else in this report is secondary to this. |
| `T2R-02-INTRO-ONE` | **Authored** | One more place where two of your answers point in different directions. None of it is scored twice — we score what you told us. But it is something an investor's diligence will find, so you should see it here first. |
| `T2R-02-INTRO` | **Lifted** | {n} more places where two of your answers point in different directions. None of them is scored twice — we score what you told us. But each one is something an investor's diligence will find, so you should see it here first. |
| `T2R-COVER-INTRO` | **Lifted** | Seven pillars, each weighted by how much it decides franchise success rather than business success. The full set of answers places you at {score}. |
| `T2R-06-INTRO` | **Lifted** | Each pillar below carries your score, what that score looks like in practice, why it matters for franchising specifically, and what the next level up looks like. The answers each score was built from are listed at the foot of every block. |
| `T2R-07-CLOSE` | **Approved** | The ladder describes where a business stands, not how long it takes to move. That depends on which gaps you close and in what order. |
| `T2R-10-CONTACT` | **Approved** | Questions about anything in this report — reply to the email it came with, or write to bd@corpculture.co. |

**Section 10 carries this line and no other** *(T112)*. The sample's Roadmap card has its own — *"Have a question first? Write to us at… or WhatsApp…"* — and Design drew both. **Two contact lines in one section is one too many, and the card's offers WhatsApp, which Ronak ruled against on the same day he approved this one.** The card's line goes.
| `T2R-DISCLAIMER` | **Lifted** | This report is based on the answers you provided across the free assessment and the full questionnaire. It is a decision-support tool, not a guarantee of franchise success.<br>Corporate Culture is a brand of Blue Bird Ventures · corpculture.co · bd@corpculture.co · +91 8072 830 857 |

### Table headers and inline labels

| Key | Source | Copy |
|---|---|---|
| `T2R-TH-PILLAR` | **Lifted** | Pillar |
| `T2R-TH-SCORE100` | **Lifted** | Score out of 100 — **the bar table's header, a different table from the score table below it** *(Design, v54)* |
| `T2R-TH-SCORE` | **Lifted** | Score |
| `T2R-TH-WEIGHT` | **Lifted** | Weight |
| `T2R-TH-STATUS` | **Lifted** | Status |
| `T2R-WEIGHT-INLINE` | **Approved** | {pct}% weight |
| `T2R-PILLAR-META` | **Lifted** | {pct}% of score · {status} |
| `T2R-GAPBAR-FOOT` | **Approved** | Bars show each pillar's score out of 100. Ranking is by what the gap costs, which is the score and the weight together — so a lower bar is not always a higher-ranked gap. |
| `T2R-03-LEGALNOTE` | **Lifted** | Legal and IP readiness is assessed separately rather than scored — see Section 05. |
| `T2R-08-FOOT` | **Approved** | Comparison is drawn from brands we have worked with in the same category. Where too few exist to compare fairly, this section says so rather than inventing a benchmark. |

**Section 08 discloses the thin pool once** *(T113)*. The sample's own note — *"…publishes fee, royalty and investment benchmarks only for categories where we have closed enough deals"* — now sits directly above this one. **Two disclaimers stacked read as nervousness about the same fact.** The sample's note goes; this one is the Ronak-approved wording and says the same thing in the founder's language.
| `T2R-HARDSTOP` | **Lifted** | Must resolve — hardest stop in this report |

**`T2R-03-INTRO` was keyed by guess and is the cover paragraph** *(T107, Design v54)*. **Its token was a guess too** — I wrote `{band}` when restoring the clause; the generator's `sc` is `r1(OVERALL)`, the rounded score, so the line reads *"places you at 68.8"* *(T114, Design v55)*. It renders in the sample's `herotxt`, above the band scale — **not in Section 03, where I put it.** Renamed `T2R-COVER-INTRO` and given back its second clause, which I had also dropped. **Section 03 has no intro of its own in the sample, and does not need one**: the table and the bars are the explanation.

**`T2R-03-LEGALNOTE` is the sample's first sentence and nothing more** *(T109)*. Design kept it and dropped the second — *"…findings here cap a result"* — correctly, and then declined to reword rather than write copy, which is the right instinct. **The remaining sentence is true**: legal readiness is assessed and not scored, and the pointer to Section 05 is now safe because Section 05 is always there.

**All three held strings are released** *(T111)* — `T2R-07-CLOSE`, `T2R-08-FOOT` and `T2R-10-CONTACT`. Holding them until they were read is the rule that stands: **an Authored string drawn before it is read is how an unreviewed sentence reaches a customer.** Three others — `T2R-BIO-LINE`, `T2R-GAPBAR-FOOT` and `T2R-WEIGHT-INLINE` — **had already reached the boards unread**, and were caught only because the provenance column was added.

**`T2R-GAPBAR-FOOT` earns its place.** Section 03's bars are scores and Section 04's order is weighted cost, so **the longest bar is not always the top-ranked gap** — a founder who notices the mismatch and finds no explanation concludes the Report is wrong. One sentence prevents it.

**`T2R-PILLAR-META`'s `{status}` is the same vocabulary as Section 03's status column** — Weak, Average, Good, or `T2R-NOTASSESSED` — never a second set of words for the same thing *(D11)*.

**`T2R-HARDSTOP` marks one item at most.** It is the hardest gate present, the same one that leads Section 01 *(§1.1)*. **If nothing is hard-stopped, no row carries it** — it is not a label every must-resolve item gets.
