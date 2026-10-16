# Content Library — Tier 2 Landing Page

**Version 1.5 · 15 October 2026**

*v1.5 — `T2L-PRICE-COVERS` promised delivery "within 24 hours" with no working-days qualifier, contradicting the Terms and the Refund Policy. **It sits on the price card, which is the sentence a founder quotes back at you** (Design, v44).*

*v1.4 — four claims removed that no record supported: a live Strings PDF, "real pages from a Report we delivered", "Several brands have read theirs and decided to wait", and the event-log claim. **Those edits were made on 15 October and the version was never bumped**, which is how `AUTHORITIES.md` came to list a v1.5 that has never existed. The content was current; the header was not. **Standing rule: no claim about customers, volumes, outcomes or system behaviour goes on a sales surface until a record supports it.** The "roughly half" figure still used in this file's reasoning is an expectation from the band model, not an observation — it must not become a string.*

*v1.3 — `T2L-CRED-1` and `T2L-CRED-2` filled from the figures already published on the live Tier 1 result. §3 rewritten; no placeholders remain.*

*v1.2 — adds `T2L-SAMPLE-DL-BTN` and `T2L-SAMPLE-DL-NOTE` for the sample download beneath the page strip. **Secondary action: outline or text button, never the filled orange of the primary CTA, and it appears once — not in the sticky bar or the closing block.** Two calls to action at equal weight compete, and the free one wins.*

*v1.1 — four headings now carry the product name in full, matching the Screen 1 design (Sakthikkumaran's call, 12 October): `T2L-SAMPLE-HEAD`, `T2L-CONTENTS-HEAD`, `T2L-PRICE-HEAD`, `T2L-PRICE-COVERS`. The library and the design are back in step; neither moves again without the other.*

Every user-facing string on Screen 1. **This file is the single source for all of it.** Nothing here may be rewritten in a design file or typed into `content.ts` — per Content Library §22.5, a string that lives in code is a string that will be wrong in six months.

**Prices come from `CANONICAL-VALUES.md` §1.** They are never literals in this copy and never typed into a template.

**Design placeholder map.** Claude Design returned 42 placeholders, `P1`–`P38` with `P8a`–`P8e`. Each is answered below and given a library key. **The P-numbers belong to the design file and die with it. The keys are permanent.**

---

## 1. Resolving the "Roadmap" question

**`Roadmap` is the name of Tier 3. It is correct on this page, and only in this role:** naming the next tier, in the block that states the Report's boundary. It must never label anything the Report itself contains.

The black panel is the honesty block — *the Report diagnoses, it does not prescribe; prescription is the Roadmap.* Decision E5/E6 requires the limit stated before the resolution, and the comparison cards show two products at two prices.

**The risk is that a founder skims the panel and thinks a roadmap is included.** That is what the two tags are for, and why they are written the way they are below.

| Key | Reads |
|---|---|
| `T2L-TAG-REPORT` | **What you buy now** |
| `T2L-TAG-ROADMAP` | **The next step, later** |

Four words each, and together they make the boundary unmissable before anyone reads a price.

---

## 2. The copy

### Opening — known visitor

| P | Key | Copy |
|---|---|---|
| P1 | `T2L-RANGE-LABEL` | Your free Audit range |

Headline, sub-line and CTA are fixed and already in the design: *"You scored between {low} and {high}."* · *"The Report replaces that range with one number, and tells you what is behind it."* · **Get my full report**

| P | Key | Copy |
|---|---|---|
| P4 | `T2L-KNOWN-CARRY` | Your eleven Audit answers carry over. The Report adds about thirty more and goes considerably deeper. |

### Opening — cold visitor

| P | Key | Copy |
|---|---|---|
| P2 | `T2L-COLD-HEAD` | **Most brands franchise before they are ready.** |
| P3 | `T2L-COLD-SUB` | The Franchise Readiness Report scores your business across seven areas, names what would stop a partner signing, and tells you what to fix first. Some brands will finish it and decide to wait. That is a useful answer too. |
| P5 | `T2L-COLD-WHY-AUDIT` | The Report is built from your Audit answers, so the free Audit comes first. It takes four minutes. |
| P35 | `T2L-STEP1-LABEL` | Step 1 · The Audit |
| P36 | `T2L-STEP2-LABEL` | Step 2 · The Report |

**On P2.** It is the lead finding of the entire product stated as a headline, and it is true. It does not promise the reader they are ready — it makes them want to know which kind they are. A headline that flattered would misrepresent a product that tells roughly half its buyers to wait.

### Sample pages

| P | Key | Copy |
|---|---|---|
| P6 | `T2L-SAMPLE-HEAD` | Every page of a Franchise Readiness Report |
| P7 | `T2L-SAMPLE-SUB` | A complete Report for a business we invented — because we will not publish a client's. Every page, every number and every sentence is exactly what you receive. |
| P8a | `T2L-CAP-SCORE` | Your score, final and precise |
| P8b | `T2L-CAP-LEAD` | What we would say first |
| P8c | `T2L-CAP-AREAS` | All seven areas, scored |
| P8d | `T2L-CAP-DIAGNOSIS` | One area, in writing |
| P8e | `T2L-CAP-GAPS` | Your gaps, ranked by cost |
| P9 | `T2L-SAMPLE-HINT` | Tap any page to enlarge |
| — | `T2L-SAMPLE-DL-BTN` | Download the full sample Report |
| — | `T2L-SAMPLE-DL-NOTE` | Chai Junction is a fictional business. Nine pages, exactly as a real one arrives. |

### Contents

| P | Key | Copy |
|---|---|---|
| P10 | `T2L-CONTENTS-HEAD` | What is in the Franchise Readiness Report |

The seven numbered lines beneath are already correct in the design and come from the report structure, not from here.

### The boundary — the black panel

| P | Key | Copy |
|---|---|---|
| — | fixed | **This diagnoses. It does not prescribe. That is the Roadmap.** |
| P11 | `T2L-BOUNDARY` | The Report tells you where you stand and what is in the way. It does not hand you a franchise model, site criteria or an agreement. That work needs your numbers rebuilt from the ground up, and that is the Roadmap. |
| P37 | `T2L-TAG-REPORT` | What you buy now |
| P12 | `T2L-REPORT-DOES` | Tells you where you stand, and what is blocking you |
| P13 | `T2L-REPORT-GETS` | Seven area scores, your gaps ranked by what they cost, the non-negotiables that would stop a partner signing, and where your answers disagree with each other. |
| P38 | `T2L-TAG-ROADMAP` | The next step, later |
| P14 | `T2L-ROADMAP-DOES` | Tells you what to do about it, in order |
| P15 | `T2L-ROADMAP-ADDS` | What a partner would actually earn, a 90-day plan with costs and sequence, and a call with our team. |
| P16 | `T2L-ROADMAP-WHEN` | Offered after the Report, never before and never bundled. If the Report says you should wait, we will say so. |

**P16 is doing more work than it looks.** It removes the suspicion that this page is a two-step upsell, and it is the only honest way to name a second price on a page selling the first.

### The reviewer

| P | Key | Copy |
|---|---|---|
| P17 | `T2L-REVIEWER-KICKER` | Reviewed by a person |
| P18 | `T2L-REVIEWER-LINE` | Ronak reads and signs off every Report before it reaches you. None goes out automatically. |
| P19 | `T2L-CRED-1` | 500+ franchise deals closed across 50+ brands |
| P20 | `T2L-CRED-2` | 20+ years in franchise development · ₹100+ Cr facilitated |

### Price

| P | Key | Copy |
|---|---|---|
| P21 | `T2L-PRICE-HEAD` | What the Franchise Readiness Report costs |
| P22 | `T2L-PRICE-COVERS` | One Franchise Readiness Report, reviewed by Ronak, delivered within 24 hours on working days. No subscription and nothing recurring. |
| P23 | `T2L-PRICE-COLD` | You can buy the Report once your free Audit is done. The Audit takes four minutes. |

### Payment trust block

Sits inside the price card, beneath the CTA. **Added at Sakthikkumaran's direction** — at the point of payment these carry real weight for an Indian SME founder, and their absence costs more than their presence.

| Key | Copy |
|---|---|
| `T2L-PAY-SECURE` | Payments processed securely by Razorpay |
| `T2L-PAY-METHODS` | UPI, RuPay, Visa, Mastercard and netbanking accepted |
| `T2L-PAY-INVOICE` | GST invoice issued with every purchase |
| `T2L-PAY-REFUND` | Refund policy *(link)* |

**Three conditions on these.**

**`T2L-PAY-METHODS` must match what Razorpay is actually configured to accept.** Listing a method that fails at checkout is worse than not listing it. Confirm against the live Razorpay account before launch, and trim the list rather than the other way round.

**Logo usage follows Razorpay's brand guidelines** — their mark, and the network marks, have required clear space and minimum sizes. Take them from Razorpay's own asset kit, never a screenshot.

**`T2L-PAY-INVOICE` is safe to print.** Blue Bird Ventures is GST-registered and raises an invoice on every sale. The SAC code still with the CA determines what appears *on* the invoice, not whether one is issued.

**`T2L-PAY-REFUND` points at a policy that does not yet exist — see §5.**

### What happens and when

| P | Key | Copy |
|---|---|---|
| P24 | `T2L-STEPS-HEAD` | What happens, and when |
| P25 | `T2L-STEP-QUESTIONS` | Your numbers, systems, brand, market, partners, support and legal position. |
| P26 | `T2L-STEP-SITTING` | Your answers save as you go. You can stop and come back. |
| P27 | `T2L-STEP-DELIVERY` | Ronak reviews it, then a link reaches you by email and on WhatsApp. The PDF is yours to download from it. |

### FAQ

| P | Key | Copy |
|---|---|---|
| P28 | `T2L-FAQ-HEAD` | Questions founders ask |

**Can I finish it later?** — `T2L-FAQ-RESUME` (P29)

> Yes. Every answer is saved as you give it, and we email you a link the moment you start. Close the tab, change phone, come back next week — you will land on the question you left.

**What if my accountant needs to help?** — `T2L-FAQ-ACCOUNTANT` (P30)

> That is common. **Your Report link is private — don't forward it, because it carries every answer you gave.** Download the PDF from it and send that instead. Section 1 asks for margin, profitability and debt position; most founders answer the rest themselves and get help with those. You can stop there and return when you have the figures.

**Is my data safe?** — `T2L-FAQ-DATA` (P31)

> Your answers are stored on our own servers and are not sold, shared, or used to train anything. Only Ronak and the reviewing team see them. Ask us to delete your record at any time and we will.

**What if I am not ready to franchise yet?** — `T2L-FAQ-NOT-READY` (P32)

> Then the Report is worth more to you, not less. It names what is missing and ranks it by what it costs you — which is the difference between a year spent well and a year spent on the wrong thing.

**P29 states the draft guarantee in customer words** and must stay true to Decision T32. If the draft behaviour changes, this line changes with it.

**P31 claims nothing we do not do.** Do not add "bank-grade", "military-grade" or a certification we do not hold. If a DPDP notice is published later, link it here rather than describing it.

### Closing

| P | Key | Copy |
|---|---|---|
| P33 | `T2L-CLOSE-KNOWN` | You know your range. Now find out where you sit. |
| P34 | `T2L-CLOSE-COLD` | Start with the free Audit. It takes four minutes. |

---

## 3. Ronak's credentials — settled 12 October

**Use the figures already published on the live Tier 1 result**, which carries them under the heading *"Who Conducts Your Audit"*:

> **₹100+ Cr** investments facilitated · **500+** franchise deals · **50+** brands scaled · **20+** years of expertise

Rendered on Screen 1 as two lines beneath his name:

| Key | Copy |
|---|---|
| `T2L-CRED-1` | 500+ franchise deals closed across 50+ brands |
| `T2L-CRED-2` | 20+ years in franchise development · ₹100+ Cr facilitated |

**Sakthikkumaran's call: match Tier 1 rather than introduce a third set of numbers.** These are already live and public on the Audit result, so Screen 1 adds no new claim — it repeats an existing one, which is the right default for a figure that appears on several surfaces.

**One consequence worth knowing.** The four figures now live in three places: the live Tier 1 result, this library, and the Report and Roadmap PDF bio blocks. If any of them ever changes, all three change together. `CANONICAL-VALUES.md` §9 is where that checklist belongs.

## 4. Rules for whoever edits this next

**Prices are never literals here.** They render from the pricing config. `CANONICAL-VALUES.md` §1 is the authority, and §9 lists every file to check when a price changes.

**Tier names on customer-facing screens are the Audit, the Report, the Roadmap.** Never "Tier 1", "Tier 2", "Tier 3".

**No exclamation marks. No urgency, countdowns or scarcity.** Nothing is "limited", "exclusive" or "transformative".

**Nothing claims the Report will say the brand is ready.** Roughly half will be told the opposite, and copy that implies otherwise produces a refund conversation and a bad review from someone who got an accurate answer.

**Word limits in the design are real.** Each one above fits the limit Design specified. A longer rewrite will break a layout that was built around it — check before you lengthen.

---

## 5. The refund policy — needed before Screen 2

The link is live in the design and in the footer. **There is no policy behind it**, and this cannot be solved by writing copy: it is a commercial decision.

**Why it is harder here than for most products.** The Report is a judgment delivered by a named person. Roughly half of buyers will be told their business is not ready — and that is the product working correctly, not failing. A policy that allows *"I did not like the answer"* refunds would refund the product's core use case.

**Recommended shape, for Sakthikkumaran and Ronak to confirm:**

> **Full refund any time before the Report is generated. None afterwards.**
>
> Up to that moment nothing has been produced and nothing has cost us anything, so the refund is free to give and generous to offer. Once the Report exists, the work is done and the deliverable is a judgment — and a judgment you disagree with is still the judgment you paid for.
>
> **We also refund in full if we miss the 24-hour delivery window** and you ask. That keeps the promise on the page honest.
>
> Duplicate or failed payments are refunded without being asked.

**Why this shape rather than a window of days.** It is one testable line, it needs no case-by-case decision, and `event_log` already records the exact moment a Report is generated — so the boundary is a database query, not an argument.

**Where it has to appear:** this page, the checkout (Screen 2), the receipt email, and the site footer. Once written it becomes a published page, so it is a content task, not a library key — `T2L-PAY-REFUND` is only the link label.

**Until it is written and published, the link has nowhere to go.** Either it is finished before Tier 2 launches, or the link comes off both the card and the footer.
