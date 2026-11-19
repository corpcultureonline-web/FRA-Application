# Content Library — Tier 1 Landing Page

**Version 1.7 · 13 November 2026**

> **v1.7** — **`T1L-BIO-BODY` compressed, and `T1L-STORY-WATCH` repointed** *(13 November · T188)*. The bio is a fragment now, a caption under Ronak's name rather than a second introduction, so the four stat tiles land instead of following a soft sentence. **Design noted the trim also strengthened the claim** — *"helping them scale"* became *"scaled"* — **which is true, and it agrees with `T1L-STAT-3`'s *50+ Brands scaled*, already confirmed by Ronak** *(`CANONICAL-VALUES.md` §1c)*. **`T1L-STORY-WATCH` no longer points at YouTube**: it points at the corpculture.co founder article, same tab, and **it must not render at all until that article exists** — a visible link that does nothing is worse than no link. **Open: *"long-term expansion clarity"* is the weakest phrase in the bio and always was.**

> **v1.6** — **the founder block, and `§7` folded into it** *(13 November · T186)*. `§7 Who conducts your audit` no longer exists as a block: its `T1L-BIO-*` and `T1L-STAT-*` keys move into the new `§6a`, unrenamed. **`T1L-BIO-BODY` loses its last sentence** — *"The 7 pillars in this assessment come from those engagements"* contradicted the new headline directly above it, which claims a different origin for the same instrument. **Design caught that; I moved the bio in without reading it against the headline I had just written.** `T1L-BIO-KICKER` is retired. **The question count is the numeral `11` everywhere on this page** — four of its five instances already were, and the rule was nowhere written down.

> **v1.5** — `T1L-FAQ-COST` said *the report* where `CANONICAL-VALUES.md` §1b sets the short form as **the Report**. Found in the same sweep as the result page's six.

> **v1.4** — **v1.3 fixed the address below and left it broken above** *(Design · T175)*. §10's table still read *[CONFLICT — see below]* while the section under it gave the value, so the one row anybody keying the footer would copy was the wrong one. §4's note still said Result §19 *needs* correcting; v1.13 did it.

> **v1.3** — **O24 is closed and the footer was right** *(Sakthikkumaran, 30 October)*. `T1L-FOOT-ADDRESS` is Shivalaya Buildings, Egmore; `Terms-and-Conditions.md` and `Privacy-Policy.md` are corrected to match, in three places including the Grievance Officer block.

> **v1.2** — **six corrections from Design's rekeying round** *(29 October · T168)*, four of them mine. The button is on **two** sticky header states, not three. `T1L-FAQ-AFTER` said *"below"* of a FAQ that is **two columns on desktop**, where the answer sits beside the question, not under it. **Four footer legal links had no keys** — and one of them, Refund Policy, **is not on the live page at all while `/franchise-audit/refunds` returns 200**. **§4's ownership ruling named `A2-*` and `A2-*` is superseded** — the result library rules against it in its own `PILLAR_SUBTITLE` section while §19 still lists it, and I quoted the stale side. **`T1L-HERO-SAMPLE` points at the PDF** — verified live; the board's `#sample` anchor is board drift and is broken besides. **§4a added: the pillar-name register**, because a ruling that libraries may not duplicate pillar names is unenforceable against prose that has to name them.

> **v1.1** — **v1.0 was missing the hero and the whole footer** *(Design, 29 October · T167)*. Both sit outside the page's `<main>` element, and every capture I took this week read `<main>` only — the extraction tool says so in its own output and I never registered it. So v1.0 described a page beginning at *"What you get"*. The hero, the sticky headers and the footer are added; the keys misnamed `T1L-HERO-*` are renamed `T1L-GET-*`; the FAQ questions are keyed and ordered; the snapshot's sample content is keyed; and **the footer carries a registered address that contradicts the legal pages** — flagged, unresolved.
>
> **v1.0** — first issue. The landing page had been live since early October with three keys against it, which is how *"asks 44"* outlived the ruling that banned it by eleven days *(T157, T158)*.

---

## 1. What this file is

**Every string the free Audit's landing page renders**, hero and footer included.

**Strings marked RULED are not yet live.** Where this file and the live page disagree, **this file is the target and the live page is the work**.

**Not here:** the questionnaire, the result page, the legal pages, or the recovery flow — each has its own library.

**The sample result card drawn on this page renders the legal check**, so it carries the three gate states, `T1R-GATE-*`, owned by the result-page library.

---

## 2. The hero — above `<main>`

| Key | Copy |
|---|---|
| `T1L-HERO-HEAD` | Is your business ready to franchise? |
| `T1L-HERO-SUB` | 11 questions. About 4 minutes. Free, with no signup. |
| `T1L-HERO-CTA` | Start the audit |
| `T1L-HERO-SAMPLE` | **RULED** — See a sample audit result |
| `T1L-STICKY-CTA` | Start the audit |

**`T1L-HERO-SAMPLE` is the third instance of the rename and was outside the original ruling**, which named only the card's button and the closing button. It renames with them.

**It points at `/franchise-audit/sample-report.pdf`, not at an anchor** — verified live on 29 October, where all three sample links carry the same `href`. **Any board drawing it as `#sample` is drift**, and broken drift at that: the card's section id is `sample-report`, so the anchor resolves to nothing.

**`T1L-STICKY-CTA` is the button on the two sticky header states that carry one** — over-white and over-beige, at both widths. **The at-top header has no button** *(Design, 29 October)*. It holds the same words as `T1L-HERO-CTA` and `T1L-CLOSE-CTA` but is a separate element in a separate component; one key across all three would couple things that may legitimately diverge at different widths.

**Stored sentence case. Capitals on screen are styling** *(T104)*.

---

## 3. What you get

| Key | Copy |
|---|---|
| `T1L-GET-KICKER` | What you get |
| `T1L-GET-HEAD` | A clear picture of where you stand. |
| `T1L-GET-SUB` | Your answers turn into a one-page snapshot. Here is what a founder receives. |

**These three were `T1L-HERO-*` in v1.0 and are renamed.** They never described the hero, and a key named for a section it does not belong to is a trap for whoever looks for the hero later.

### The four bullets

| Key | Copy |
|---|---|
| `T1L-GET-1` | **RULED** — Where you stand across the 7 pillars that decide a franchise |
| `T1L-GET-2` | **RULED** — Your weakest pillar named, with what it costs |
| `T1L-GET-3` | A legal check — trademark and disputes |
| `T1L-GET-4` | Things you can act on yourself, straight away |

---

## 4. The snapshot card

### Labels

| Key | Desktop | Mobile at 390 |
|---|---|---|
| `T1L-SNAP-KICKER` | Franchise readiness snapshot | `T1L-SNAP-KICKER-SM` — Readiness snapshot |
| `T1L-SNAP-FLAG` | Illustrative example | `T1L-SNAP-FLAG-SM` — Illustrative |
| `T1L-SNAP-RANGE-LABEL` | Readiness range | — |
| `T1L-SNAP-SCALE-LOW` | Not ready | — |
| `T1L-SNAP-SCALE-HIGH` | Ready to scale | — |
| `T1L-SNAP-RANGE-NOTE` | Always a range. 11 answers place you closely, not exactly. | — |
| `T1L-SNAP-WEAKEST` | **RULED** — Weakest pillar | — |
| `T1L-SNAP-LEGAL` | Legal check | — |
| `T1L-SNAP-DISCLAIMER` | This is a sample result for a business that does not exist. Your own result will look like this, with your answers. | — |

**The two mobile variants exist because the full strings wrap at 390** *(Design, 29 October)*. Live mobile already used the shorter forms; v1.0 held only the long ones, so drawing from the library broke the label pill onto two lines. **A variant is written only where the default is actually wrong at that width, not merely tight** — the same rule the scoring spec applies to outlet-count variants.

### The sample content — keyed, and it is fixed copy

| Key | Copy |
|---|---|
| `T1L-SNAP-RANGE-VALUE` | 54 – 71 |
| `T1L-SNAP-WEAKEST-NAME` | Market Proof |
| `T1L-SNAP-WEAKEST-LINE` | Every sale so far comes from one city. There is no proof yet that the model works where people don't already know you. |
| `T1L-SNAP-TM` | Trademark: filed, not yet registered |
| `T1L-SNAP-DISPUTE` | Disputes: none declared |

**This card is a drawing, not a rendered result.** Nothing on it comes from the engine, which is why these are copy and need keys. v1.0 keyed the card's furniture and left its content unkeyed — the same half-finished job that left the hero out.

**`T1L-SNAP-TM` and `T1L-SNAP-DISPUTE` are the legal check**, so they take `T1R-GATE-INPROGRESS` and `T1R-GATE-CLEAR` as their state markers. A filed trademark is **In progress** here exactly as it is in the Report.

### The seven pillar rows

**The rows are not keyed in any markdown library, and that is correct — but v1.1 named the wrong owner.**

**v1.1 said the subtitles are `A2-*`, citing §19 of the result library. They are not.** The same file, in its `PILLAR_SUBTITLE` section, rules the opposite in plain words: *"Seed the approved sample's wording, not Group A's `A2`. `A2` predates the plain-English rewrite (R2), and its lines are too long for a table column."* **§19's row was stale and I quoted the stale side of a contradiction inside one document.** **Corrected in Result v1.13**; `A2-*` no longer appears as the owner anywhere.

### Who owns what

| | Owner |
|---|---|
| The seven **display names** | **`FRA-Tier1-Scoring-Specification.md` §1** — the code / pillar / display-name / weight table. Settled since v1.0: the plain set on every customer-facing surface |
| The seven **subtitles** | **`PILLAR_SUBTITLE`, 7 pieces, `ALWAYS`** — seeded from the approved table in `Content-Library-Tier1-Result-Page.md`, not from `A2-*` |
| **Good / Average / Weak** and the Weakest chip | Computed. No copy to own |

**Neither is reachable from a markdown library today, because `PILLAR_SUBTITLE` is not seeded.** Until it is, both pages draw from code. That is on the developer's list and is the one real gap §4 of the reply to Design names.

## 4a. The pillar-name register

**Three strings in this library contain pillar names**, and prose cannot avoid them — you cannot answer *"What do the 7 pillars measure?"* without naming all seven. **They are copy and they stay here**, but a rename has to find them:

| Key | Pillars named |
|---|---|
| `T1L-SNAP-WEAKEST-NAME` | Market Proof |
| `T1L-FAQ-SCORE` | Profit & Payback, Systems |
| `T1L-FAQ-PILLARS` | all seven |

**`CANONICAL-VALUES.md` §1d carries the register for every library.** This table is for whoever edits *this* file.

**`T1L-FAQ-PILLARS` is the `PILLAR_SUBTITLE` set turned from questions into clauses, and that is deliberate.** *"Does it work outside your home city?"* becomes *"whether it works outside your home city."* All seven match. **They differ in grammar and must never differ in substance** — a founder reads the FAQ before he starts and the subtitle beside his own score, and the two describing different things is worse than either being imperfect. **If one is reworded, reword both.**

---

## 5. The sample card — RULED throughout

**This card offers the four-page Audit sample, not the nine-page Report sample.** Its body already said *"a completed sample audit"* while its heading and buttons said *report*.

| Key | Now live | RULED |
|---|---|---|
| `T1L-SAMPLE-HEAD` | Sample report | **Sample audit result** |
| `T1L-SAMPLE-SUB` | Read a completed sample audit before you start. | unchanged |
| `T1L-SAMPLE-BODY` | A full result for a fictional business, every page as a founder receives it. 4 pages, PDF. | unchanged |
| `T1L-SAMPLE-CTA` | Open the sample report | **Open the sample audit result** |
| `T1L-SAMPLE-NOTE` | Opens straight away in a new tab. No email, no form, nothing to sign up for. | unchanged |

**Three buttons point at this PDF, not two:** `T1L-SAMPLE-CTA` on the card, `T1L-CLOSE-SAMPLE` in the closing block, and `T1L-HERO-SAMPLE` in the hero. All three rename together.

**The page count stays.** Four is checkable and distinguishes this document from the Report's nine — the opposite case from the question count, which must never be fixed because it varies.

---

## 6. How it works

| Key | Copy |
|---|---|
| `T1L-HOW-HEAD` | How it works |
| `T1L-HOW-SUB` | 3 steps. Nothing to prepare. |
| `T1L-HOW-1-TITLE` | Answer 11 questions |
| `T1L-HOW-1-BODY` | About your outlet, your systems, your team and your brand. Roughly 4 minutes. |
| `T1L-HOW-2-TITLE` | See your result straight away |
| `T1L-HOW-2-BODY` | **RULED** — Your score range, your 7 pillars, and your weakest point. No waiting. |
| `T1L-HOW-3-TITLE` | Keep it — a copy by email |
| `T1L-HOW-3-BODY` | Your result is on screen the moment you finish, and a copy goes to the email you give us at the start. |

**`T1L-HOW-3-TITLE` and `-BODY` both change when WhatsApp delivery ships.** Not changed yet: the copy must not promise a channel that does not exist.

---

## 7. The founder block — `§7` folded into it *(T186)*

**There is no longer a separate *Who conducts your audit* block.** It was a second credibility block on a page where **half of all visits last under one second**, and it argued the opposite case to this one: `§7` was authority, this is failure. Two of them competed; one does both jobs.

**Position: after the sample audit result card**, so the page reads hero → *What you get* → sample card → **this** → *How it works*.

**It sits after both proof elements, not between them** — the block ends in a button, and `§5`'s *See a sample audit result* immediately below it would have offered an easier click that leaves the page for a PDF.

### Order inside the block, which is the design

**kicker → headline → video → watch link → body → Ronak and the stats → bridge → button.**

The failure earns the attention, the credentials prove it was learned, the bridge turns it into a reason to act, and the button is the next thing the eye meets. **The bridge ends on *"these 11 questions"* and the button starts them.** The stat tiles must not move below the bridge: four numbers between the emotional close and the button is a cool-down.

### The copy

| Key | Copy |
|---|---|
| `T1L-STORY-KICKER` | Why this audit exists |
| `T1L-STORY-HEAD` | The 11 questions came from two businesses I lost. |
| `T1L-STORY-PLAY` | Play Ronak's story · 35 seconds |
| `T1L-STORY-WATCH` | Watch the full story · 7 min — **points at the corpculture.co founder article, same tab. NOT YouTube** |
| `T1L-STORY-BODY-1` | The first depended entirely on me. I couldn't open a second outlet because there was no second me — and when the property was sold, everything I'd built went with it. |
| `T1L-STORY-BODY-2` | The second had a team, systems and five outlets in eighteen months. It also had a broken model, and every new outlet made the leak bigger. Growth doesn't fix a broken business. It multiplies it. |
| `T1L-STORY-BRIDGE` | Both could have been caught early, if someone had asked the right questions before I invested. That is what these 11 questions ask. |
| `T1L-STORY-CTA` | Start the audit |
| `T1L-STORY-CTA-SUB` | 11 questions. About 4 minutes. Free. |

**`T1L-STORY-HEAD` and the three body keys are first person.** Everything else on this page is in Corporate Culture's voice. The shift is intentional — it is Ronak speaking — and it must survive every later edit.

**`T1L-STORY-WATCH` must not render until the article exists** *(T188)*. On a board an inert link is a marked placeholder; on the live page it is a visible *Watch the full story* that does nothing when tapped. **Hide the element, do not disable it.**

**It points at our own article and not at YouTube because the block has two exits — one into the funnel and one out of it — and the one out is the more appealing offer.** A story beats a form. On Instagram traffic a YouTube tap is an app switch with no route back, which is the exact exit the façade exists to prevent. **The article can carry a CTA back to the audit; YouTube cannot.** It follows that **the article must use the same click-to-play façade for the full film** — moving the film to our own page only helps if that page does not hand the visitor off either.

**`T1L-STORY-PLAY` is an accessible label, not printed copy.** Screen readers announce it; nothing renders it on screen.

***"Growth doesn't fix a broken business. It multiplies it."* is lifted as a pull-quote** and stays inside `T1L-STORY-BODY-2`, so the key remains one string.

**`T1L-STORY-CTA` is a fourth CTA key, not a duplicate.** `T1L-HERO-CTA`, `T1L-STICKY-CTA` and `T1L-CLOSE-CTA` are already separate on the stated grounds that they may diverge at different widths. **On the Tier 1 result page, twelve of seventeen upgrade clicks came from the button at the foot of the page — which only 68% of readers reach — against five from the one 97% of them see.** A button at the end of an argument outperforms a button that is merely present.

### Carried in from the retired `§7`

| Key | Copy |
|---|---|
| `T1L-BIO-NAME` | Ronak Patel |
| `T1L-BIO-ROLE` | **RULED** — Founder & CEO, Corporate Culture |
| `T1L-BIO-BODY` | **RULED, compressed T188** — Consumer brands across F&B, retail, lifestyle, wellness and education — scaled with structure, funding access and long-term expansion clarity. |

**`T1L-BIO-BODY` lost its final sentence** — *"The 7 pillars in this assessment come from those engagements."* **It contradicted `T1L-STORY-HEAD` directly above it**, which claims the instrument came from two businesses Ronak lost rather than from client work. Both claims are true of different things — the failures taught him what to look for, the engagements taught him how to measure it — but side by side they read as one claim made twice, differently. **The headline makes the stronger version, so the sentence is redundant here.**

**Compressed again at T188**, from a sentence to a fragment. It now reads as a caption under Ronak's name rather than a second introduction, and the four stat tiles below it land without a soft sentence in front of them. **The trim also strengthened the claim** — *"helping them scale"* became *"scaled"*, which asserts that Corporate Culture scaled those brands. **That is deliberate and consistent**: `T1L-STAT-3` already says *50+ Brands scaled*, confirmed by Ronak on 20 October.

> **Open, and it predates all of this:** ***"long-term expansion clarity"*** **is the weakest phrase in the string.** Structure and funding access are concrete; nobody scales *with clarity*. **The safe fix is to drop it** — *"scaled with structure and funding access"* — two real things rather than two real and one vague. **Replacing it needs Ronak**, because what Corporate Culture provides is his claim to make, not ours to invent.

**`T1R-BIO-BODY` on the result page keeps its own wording and is untouched.** The two strings already differed; only `T1L-BIO-ROLE` is mandated to match across surfaces, and it still does — `T2R-BIO-ROLE`, `T2L-BIO-ROLE` and `T1R-BIO-ROLE` all move together with it.

**`T1L-BIO-KICKER` is retired.** `T1L-STORY-KICKER` replaces it.

| Key | Copy |
|---|---|
| `T1L-STAT-1` | ₹100+ Cr · Investments facilitated |
| `T1L-STAT-2` | 500+ · Franchise deals |
| `T1L-STAT-3` | 50+ · Brands scaled |
| `T1L-STAT-4` | 20+ · Years of expertise |

**Settled 12 October and confirmed by Ronak on the 20th** — `CANONICAL-VALUES.md` §1c. The differing figures on iamronak.com and corpculture.co are a separate tidy-up and do not change these.

### The question count is a numeral on this page *(T186)*

**`11`, not *eleven*.** `T1L-HERO-SUB`, `T1L-HOW-1-TITLE`, `T1L-FAQ-RANGE` and `T1L-CLOSE-SUB` already did; only `T1L-FAQ-COST` spells it out, inside a long prose answer where it still reads better. **Design found the block mixing both, because the rule existed in four places and was written down in none.** It is written down now.

---

## 8. FAQ

| Key | Copy |
|---|---|
| `T1L-FAQ-HEAD` | Questions |

**The order is set here.** v1.1 said it was load-bearing because `T1L-FAQ-AFTER` pointed at `T1L-FAQ-COST` as *"below"*. **On desktop the FAQ is two columns and the cost answer sits beside that question, not under it** *(Design, 29 October)* — so *"below"* was wrong on the wider of the two layouts and the word is gone. **The cross-reference stays and the order stays**: cost is the last question a founder asks, and a reference that names its target by title works in either layout.

| # | Question key | Answer key |
|---|---|---|
| 1 | `T1L-FAQ-WHAT-Q` | `T1L-FAQ-WHAT` |
| 2 | `T1L-FAQ-SCORE-Q` | `T1L-FAQ-SCORE` |
| 3 | `T1L-FAQ-RANGE-Q` | `T1L-FAQ-RANGE` |
| 4 | `T1L-FAQ-PILLARS-Q` | `T1L-FAQ-PILLARS` |
| 5 | `T1L-FAQ-TIME-Q` | `T1L-FAQ-TIME` |
| 6 | `T1L-FAQ-DATA-Q` | `T1L-FAQ-DATA` |
| 7 | `T1L-FAQ-LOST-Q` | `T1L-FAQ-LOST` |
| 8 | `T1L-FAQ-WHATSAPP-Q` | `T1L-FAQ-WHATSAPP` |
| 9 | `T1L-FAQ-AFTER-Q` | `T1L-FAQ-AFTER` |
| 10 | `T1L-FAQ-COST-Q` | `T1L-FAQ-COST` |

**The questions are keyed separately from the answers** *(Design, 29 October)*. v1.0 held them as bold text inside the answer rows, which is not a key — the same fault as the sales page's FAQ.

**The live page prints the first question twice**, once as the section heading and once as the accordion trigger. That is a build fault, not a missing key: `T1L-FAQ-HEAD` is *Questions* and the heading should render it.

| Key | Copy |
|---|---|
| `T1L-FAQ-WHAT-Q` | What is a Franchise Readiness Audit? |
| `T1L-FAQ-WHAT` | **RULED** — A structured assessment of whether a business can be franchised successfully. It measures 7 pillars and produces a score, along with a separate legal and trademark check. |
| `T1L-FAQ-SCORE-Q` | How is my score calculated? |
| `T1L-FAQ-SCORE` | **RULED** — Each of the 7 pillars is weighted by how much it determines franchise success. Profit & Payback and Systems carry the most weight, because they are what a franchise owner is actually buying: a model whose numbers work, and a system they can reproduce. |
| `T1L-FAQ-RANGE-Q` | Why is my score a range and not one number? |
| `T1L-FAQ-RANGE` | **RULED** — 11 questions can place you closely, not exactly. A range is honest about that. The Franchise Readiness Report asks about thirty more and gives you one number. |
| `T1L-FAQ-PILLARS-Q` | **RULED** — What do the 7 pillars measure? |
| `T1L-FAQ-PILLARS` | **RULED** — Profit & Payback — whether a franchise owner makes money. · Systems — whether someone else can run it the way you do. · Support — whether you can help an owner after they join. · Your Role — whether the business runs without you. · Market Proof — whether it works outside your home city. · Brand Pull — whether people come asking for your franchise. · Right Partner — whether you know who should run your next outlet. |
| `T1L-FAQ-TIME-Q` | How long does it take? |
| `T1L-FAQ-TIME` | About 4 minutes. No signup, no cost. |
| `T1L-FAQ-DATA-Q` | What happens to my answers? |
| `T1L-FAQ-DATA` | They are used to produce your result and nothing else. They are never shared with any brand, investor or third party without your permission. |
| `T1L-FAQ-LOST-Q` | **RULED, new** — I took the audit before. Can I get my result again? |
| `T1L-FAQ-LOST` | **RULED, new** — Yes. We keep your result for three years from your last activity. Enter the email or mobile you used on the *Get your result link again* page and we will send it there. We never show the link on screen, because it carries every answer you gave us. |
| `T1L-FAQ-WHATSAPP-Q` | **RULED, new** — Why do you need my WhatsApp number? |
| `T1L-FAQ-WHATSAPP` | **RULED, new** — Your result goes there as well as to your email, and it is the more reliable of the two — email often lands in Promotions. We may also call once to talk through what it says. The Privacy Policy lists every service that sees your number and what each one does with it. |
| `T1L-FAQ-AFTER-Q` | What happens after the free audit? |
| `T1L-FAQ-AFTER` | **RULED** — Your Score gives you a range and shows which of the seven pillars are strong and which are not. If you want the exact number, the Franchise Readiness Report gives you your precise score and a written diagnosis of all seven pillars, with your gaps ranked by what each one costs you. The Franchise Readiness Roadmap goes further again — it works out what a franchise partner would actually earn from your business and how long their money takes to come back, and it includes a call with our team to talk it through. See "What does it cost?" for prices. |
| `T1L-FAQ-COST-Q` | What does it cost? |
| `T1L-FAQ-COST` | The Franchise Readiness Audit is free — eleven questions, about 4 minutes, and your Franchise Readiness Score appears on screen straight away. The full Franchise Readiness Report is ₹1,999 + 18% GST (₹2,359). About thirty more questions, and you receive the Report within 24 hours on working days. The Franchise Readiness Roadmap is ₹5,999 + 18% GST (₹7,079). It picks up where the Report stops, works through what a franchise partner would actually earn, and includes a call with our team to talk it through. Each stage is priced on its own. Nothing is credited or adjusted if you move to the next one. |

**`T1L-FAQ-AFTER` and `T1L-FAQ-COST` now both end *"a call with our team to talk it through"***, matching `Content-Library-Tier1-Result-Page.md` §19b. v1.0 truncated it to *"with our team"* in one place and not the other *(Design, 29 October)*. **It says *our team*, not *Ronak*, and that is correct** — the Roadmap is reviewed by Ronak and the analyst team; the Report's line stays Ronak alone *(Group H v1.4, T148/T149)*.

**`T1L-FAQ-RANGE` is the string that did the most damage on this page.** It read *"asks 44"* — a fixed count, banned by `CANONICAL-VALUES.md` §8, and wrong. It survived two corrections of the same fault elsewhere because it had no key to find.

**Neither new entry goes live before WhatsApp delivery does.** `T1L-FAQ-WHATSAPP` promises a channel.

---

## 9. Closing and recovery

| Key | Copy |
|---|---|
| `T1L-CLOSE-HEAD` | Find out where you stand in 4 minutes. |
| `T1L-CLOSE-SUB` | 11 questions. Free, no signup. Your result is on screen the moment you finish. |
| `T1L-CLOSE-CTA` | Start the audit |
| `T1L-CLOSE-SAMPLE` | **RULED** — See a sample audit result |
| `T1F-ENTRY-LINK` | Already taken the audit? Get your result link again |

**`T1F-ENTRY-LINK` is owned by `Content-Library-Tier1-Find-Result.md`** and listed here only to place it: beneath **Start the audit**, as a text link, never a second button.

---

## 10. The footer — below `<main>`

| Key | Copy |
|---|---|
| `T1L-FOOT-TAGLINE` | Franchise. Fund. Scale. |
| `T1L-FOOT-CONTACT-LABEL` | Contact |
| `T1L-FOOT-EMAIL` | bd@corpculture.co |
| `T1L-FOOT-WHATSAPP` | WhatsApp +91 8072 830 857 |
| `T1L-FOOT-ADDRESS-LABEL` | Registered address |
| `T1L-FOOT-ADDRESS` | Shivalaya Buildings, 16, Ethiraj Salai, Egmore, Chennai, Tamil Nadu 600008 |
| `T1L-FOOT-NAV-PRIVACY` | Privacy Policy |
| `T1L-FOOT-NAV-TERMS` | Terms & Conditions |
| `T1L-FOOT-NAV-REFUNDS` | **RULED, not live** — Refund Policy |
| `T1L-FOOT-NAV-CONTACT` | Contact |
| `T1L-FOOT-COPYRIGHT` | © {year} Corporate Culture. All rights reserved. |
| `T1L-FOOT-ENTITY` | Corporate Culture is a brand of Blue Bird Ventures |

**The four legal-nav links had no keys** *(Design, 29 October)*. v1.1 added the footer and left its links out, which is the same half-finished job in miniature.

### The Refund Policy is not linked and the page exists

**Live carries three of these links, not four.** Checked on 29 October: Privacy Policy → `/franchise-audit/privacy`, Terms & Conditions → `/franchise-audit/terms`, Contact → `mailto:bd@corpculture.co`.

**`/franchise-audit/refunds` returns 200.** The page is built, `Refund-Policy.md` is at v1.5, and **nothing on the site points to it**.

**That is a Razorpay matter, not a tidy-up.** A refund and cancellation policy has to be reachable from the surfaces where a customer transacts, and Tier 2's checkout sits two clicks from this footer. **Design's board carrying four links is correct and the live page is the one that is wrong.**

`T1L-FOOT-NAV-REFUNDS` → `/franchise-audit/refunds`.

### The registered address — settled

**`T1L-FOOT-ADDRESS`**

> Shivalaya Buildings, 16, Ethiraj Salai, Egmore, Chennai, Tamil Nadu 600008

**Ruled by Sakthikkumaran, 30 October. O24 is closed.** The footer was right and the legal pages were wrong.

**Three strings changed, not one** — `Terms-and-Conditions.md` §1 (v1.6), `Privacy-Policy.md` §1 and **§9's Grievance Officer block** (v1.5). The third is the address a complaint under the DPDP Act is posted to, and it was the easiest of the three to miss.

**Nothing on the Tier 1 footer changes.** The boards were correct as drawn and the O24 marker comes off.

**`T1L-FOOT-COPYRIGHT` takes `{year}` as a slot and must not be hardcoded.** It currently reads 2026 in the markup.

---

## 11. Notes for whoever edits this next

**This page sits in three parts and only one of them is `<main>`.** The hero is above it and the footer below. Any sweep, extraction or check that reads `<main>` sees neither, which is how v1.0 came to describe a page beginning at *"What you get"* and why *"asks 44"* was reported as verified when the hero had never been looked at. **Read the body, not the main.**

**Nine strings here say *pillars* and are not yet live.** Until the deploy this page and the Report speak two vocabularies about the same seven things.

**No claim about customers, volumes or outcomes goes on this page without a record behind it.** We have two paying brands.

**The page count in the sample card is a fact and stays; the question count never is.**
