# Content Library — Tier 2 field help, escape answers and validation

**Version 1.6 · 21 October 2026**

> **v1.6** — **help and validation for `OR6`, `MR5` and `PP6a`**, the three conditional questions written on 21 October *(T131)*. **A multi-outlet brand would have met three questions with no help note and a number field with no range.** Found by Design, which could not draw them without it.

> **v1.5** — §6 item 1 still described the help page as claiming *"roughly half of brands are told they are not ready"*, contradicting Help Page v1.3 *(Design, v42)*. A description of a string is as capable of being wrong as the string.

> **v1.4** — `T2V-CONTRA-MARGIN`'s trigger was still the unbuildable one. The ruling in `Response-to-Developer-Audit.md` had never reached this file, which is the file Design and the developer actually build from *(Design, v41)*.

> **v1.3** — developer audit items 2, 10 and 18: the "I don't know" threshold drops to three (only four questions offer it); the invented "I don't track this" answer is withdrawn; `T2H-SI6-HELP` no longer claims the Report makes recommendations, which P6 forbids; §6 item 4 renamed per T59.

> **v1.2** — `T2H-SI6-HELP` rewritten. It named the Roadmap, which both the questionnaire rules and the help-page rules forbid, and it did so on two surfaces. The consequence it threatened is kept; the surface it named is now the Report, which is what the founder has actually bought.

> **v1.1** — contradiction copy rewritten to name the earlier answer *(§5)*; `BP3` and `BP4` stems lose "across outlets" and their notes gain a multi-outlet clause; `T2Q-HELP-A11Y` added. See `Screen4-Addendum-Design-Review.md`.

The help copy for every field that needs it, the answers a founder uses when a normal answer is impossible, the validation rules, and the help page.

**This file is the single source for all of it.** Design and the developer both build from here. Nothing in it changes a question stem or an option sentence except where marked **REWORK**, and those three are listed explicitly.

---

## 1. The principle

**Every wrong answer on this form costs us twice.** It corrupts a score the founder paid ₹1,999 for, and it produces a Report that recommends the wrong thing. A founder who inflates his margin by accident gets told his unit economics are fine, and the one finding that would have saved him is never printed.

**Almost none of it is dishonesty.** It is a man who has never calculated EBITDA entering his gross margin, or quoting a Google rating from memory as 4.5 when it is 4.1. He is trying to answer correctly and the form is not helping him.

**So the help copy has one job: make the honest answer the easy one.**

### The one rule for everything in this file

**Explain what to measure. Never explain how it scores.**

No bands, no weights, no "which option is best", nowhere — not in a tooltip, not on the help page. A founder who works out that 5 is the good answer stops telling the truth, and the Report is only worth its price because the answers are honest. *(Extends the existing rule that scoring maps never appear on the form.)*

---

## 2. Nothing is skippable

**Decision T43. Every question in the Report questionnaire must be answered.** Next stays disabled until the current question has a value. No question is optional and no answer is left blank.

Where a founder has no input, or the question does not apply to him, **he chooses an answer that says so.** A blank tells us nothing — we cannot tell a skip from a genuine absence. An answer tells us which, and absence of a thing is itself one of the most useful findings in a readiness audit.

### Most questions already have the escape built in

**We do not add "not applicable" to all 32.** If every question offers a polite exit, every founder takes it on the questions he would rather not answer — and those are precisely the questions carrying the diagnosis.

"No" on a Yes / Partial / No question already means *I do not have this*. So does "None" on training duration, "Not tracked" on footfall, "Less than 5" on hours available. These are complete answers and they score as weak, correctly: for franchising, absence **is** a weakness.

An escape answer is added only where absence means something genuinely different from a weak answer. That is seven questions.

### The three escapes, and why they must never be merged

| Answer | What it means | How it behaves |
|---|---|---|
| **Not applicable to my business** | The thing does not exist for this brand — a service brand with no stock, a brand with no Google listing | **NULL.** Excluded from the sum and the count. Not a weakness, not scored |
| **I don't know** | It may well exist. He cannot state it | **Flag only. No band effect.** Named in the Report as a gap |
| **Prefer not to answer** | A deliberate withhold. Already exists on the debt question | **NULL** |

**Why "I don't know" is not scored as the worst answer.** A founder may run a 22% margin and simply never have calculated it. Banding that as "under 5%" invents a figure he did not give.

**Why it is not a silent NULL either.** For a brand about to sell franchises, *not knowing your own numbers is a real readiness problem* even when the business underneath is healthy — you cannot present to a franchisee or a bank what you cannot state. A silent null hides the finding.

So it behaves exactly as the three legal questions already do: **flag only, no band effect**, and the Report says it out loud. No new engine work.

### The measurement finding

**Three or more "I don't know" answers in one submission → the Report leads with that.** His largest gap is not operations, it is measurement. That is a more useful opening sentence than a score, and it is the cleanest Roadmap sale on the form.

### Which questions get an escape answer

| Code | Question | Escape answer added |
|---|---|---|
| `UE7` | EBITDA margin | **I don't know my margin** |
| `UE9` | Debt and guarantees | *Prefer not to answer* — already present, unchanged |
| `BP3` | Google rating | **We don't have a Google listing** |
| `BP4` | Google reviews | **We don't have a Google listing** |
| `G2` | Franchise agreement template | **I don't know** |
| `G4` | Entity structure | **I don't know** |
| `G5` | Statutory licences | **I don't know** |

**The six anchored questions get nothing.** Their five options already span the full range including the worst case, and *"I don't know how much of my own work I would standardise"* is not a real answer about your own intention.

**This matters for the build: Screen 4's approved layout is unchanged.** No sixth card on any anchored screen.

**`BP3` and `BP4` stems drop "across outlets" / "across all outlets"** — the phrase reads oddly to a single-outlet founder and the help note covers the multi-outlet case. No scoring effect. *(`BP5`'s options keep the phrase — see `Screen4-Addendum-Design-Review.md` §4.)*

**`BP3` and `BP4` remain required.** The founder opens Google Maps in another window and reads the real number — that is the point of the help copy. The no-listing answer exists for brands that genuinely have no listing, not as a way out of looking it up.

---

## 3. Three questions need rework, not a tooltip

### 3.1 `UE7` — EBITDA margin needs a calculator

**The term defeats most single-outlet owners, and the specific error is predictable: they leave out their own salary.** Most owners do not pay themselves formally, so drawings get counted as profit. That one omission turns a 6% business into a 15% one.

**Keep one question. Add a calculator behind a link.** *(Decision T47.)*

| Key | Copy |
|---|---|
| `T2H-UE7-HELP` | This is a different number from the margin you gave in the free Audit. There we asked what a single outlet earns. Here we want what the whole company earns after head office costs and a fair salary for yourself — almost always a lower figure. Do not deduct loan EMI, depreciation or tax. |
| `T2H-UE7-CALC-LINK` | **Work it out for me** |
| `T2H-UE7-CALC-REV` | Average monthly revenue |
| `T2H-UE7-CALC-COST` | Total monthly running cost |
| `T2H-UE7-CALC-COST-NOTE` | Include rent, salaries, materials, utilities and a fair salary for yourself. Leave out loan EMI, depreciation and tax. |
| `T2H-UE7-CALC-RESULT` | That works out to **{n}%**. You can change it if your own figure is different. |
| `T2H-UE7-NOIDEA` | I don't know my margin |

The computed figure fills the field and stays editable. **One question in the register, two optional inputs** — the count of 32 does not change.

This is also how the Roadmap questionnaire already collects costs, so the two instruments stop disagreeing with each other.

### 3.2 `OR3` and `OR4` — the single-outlet trap

Both questions currently end **"across all outlets"**, and a single-outlet brand sees them unchanged. He answers *"yes, my one POS is standardised"* perfectly honestly and collects a top score on two of Operational Readiness's five values, for nothing. **That pillar carries 20% weight.**

The questions do not mean *is my own shop consistent*. They mean *could this be handed to an outlet I do not own*.

**REWORK — `OR3`**

> ~~Is a standardised POS, inventory and tech stack used across all outlets?~~
> **Could your POS, inventory and tech setup be handed to an outlet you do not own and run the same way?**

| Key | Copy |
|---|---|
| `T2H-OR3-HELP` | We are not asking whether your own outlet is consistent. We are asking whether the setup is documented and licensed so a franchisee could adopt it as it stands. If you hold no stock, answer on your POS and software alone. |

**REWORK — `OR4`**

> ~~Is there a defined quality-control or audit mechanism for consistency across outlets?~~
> **Is there a defined quality check — a checklist, audit or mystery-shop routine — that someone other than you could run?**

| Key | Copy |
|---|---|
| `T2H-OR4-HELP` | With one outlet the question is not whether quality is consistent today. It is whether there is a written check a franchisee could be held to, and that works without you present. |

**Neither gets an escape answer.** "No" already says it, and the help resolves the service-brand case.

### 3.3 `FL5` — "or on call" is carrying the whole question

The stem stays. The help does the work, because *"or on call"* will otherwise be read straight past: owners count the days they did not visit and forget the four phone calls.

**This is the answer the Report trusts over the three self-ratings in the section.** A wrong answer here is the most expensive wrong answer on the form — which is also why it now comes **first** in Section 7 *(T49)*, before the three self-ratings it would otherwise have had to agree with.

| Key | Copy |
|---|---|
| `T2H-FL5-HELP` | Count a day only if you neither visited nor were contacted about an operational decision — no calls, no approvals, no quick question on WhatsApp. If you were reachable and were reached, the day does not count. Zero is a common answer and nothing is read into it. |

**"Zero is a common answer" is deliberate.** It removes the embarrassment, and embarrassment is what inflates this number.

---

## 4. The field help

Sixteen fields. One help note each, opened by a `?` beside the label, closed by tapping anywhere. **Never a modal, never shown by default** — it is there for the founder who needs it and invisible to the one who does not.

*(This grew from the fourteen first identified: `PP3` was added on a second pass, and `OR3`/`OR4` moved up to rework.)*

### Section 1 — Your numbers

| Code | Key | Copy |
|---|---|---|
| `UE7` | `T2H-UE7-HELP` | *§3.1 above* |
| `UE8` | `T2H-UE8-HELP` | Judge this after paying yourself a fair salary. If the business only breaks even once your own drawings are counted as a cost, it is breakeven rather than profitable. |
| `UE9` | `T2H-UE9-HELP` | An encumbrance is anything that ties up an asset — a loan against property, pledged equipment, a lien. Count a guarantee as material if a lender or an investor would see it as limiting your ability to franchise. |
| `UE12` | `T2H-UE12-HELP` | Your investment ask is the total you expect a franchisee to put in — fee, fit-out, equipment, deposit and working capital. "Formally" means you have compared it against real competitor numbers, not an impression of them. |

### Section 2 — Your systems

| Code | Key | Copy |
|---|---|---|
| `OR3` | `T2H-OR3-HELP` | *§3.2 above* |
| `OR4` | `T2H-OR4-HELP` | *§3.2 above* |
| `OR6` | `T2H-OR6-HELP` | Answer for the outlet you visit least, not the one you are standing in. **The question is what a customer would notice**, not whether you have a standard written down — that is the question above. If you are unsure, the honest test is whether a regular at one outlet would be surprised by another. |

### Section 3 — Your brand

| Code | Key | Copy |
|---|---|---|
| `BP3` | `T2H-BP3-HELP` | Open Google Maps in another window, search your outlet name, and read the rating beside the stars. Please do not answer from memory — this is one of very few numbers in your Report that can be checked independently. If you run more than one outlet, average the ratings across them. |
| `BP4` | `T2H-BP4-HELP` | The total review count on your Google listing, not reviews added up across every platform. If more than one listing exists for the same outlet, use the one customers actually find. If you run more than one outlet, add the counts together. |

### Section 4 — Your market

| Code | Key | Copy |
|---|---|---|
| `MR2` | `T2H-MR2-HELP` | "Data-backed" means you could produce the figures — repeat-purchase rate, footfall counts, billing history. "Partially" means you hold some of it. If it is what you and your staff observe day to day, that is anecdotal. |
| `MR5` | `T2H-MR5-HELP` | Count outlets trading today, including any that are franchised. **Do not count outlets under fit-out, signed but unopened, or closed.** A location that trades under your brand but you do not control — a kiosk inside someone else's store, a cloud-kitchen listing — counts only if you set the standard there. |

### Section 5 — Your partners

| Code | Key | Copy |
|---|---|---|
| `PP3` | `T2H-PP3-HELP` | Territory rights are the area a franchisee is given. Exclusivity is your promise not to open another outlet inside it — including one of your own. |
| `PP5` | `T2H-PP5-HELP` | An owner-operator runs the outlet personally, day to day. An investor-operator funds it and hires a manager. They need different training, different margins and different support, which is why the question asks whether your support is built for the one you have chosen. |
| `PP6a` | `T2H-PP6A-HELP` | **"The same terms for all" means a new partner today would be offered what your existing partners signed** — same fee, same royalty, same term. Discounts given to an early partner who took a risk on you are normal and still count as varying. The question is not whether the differences were justified; it is whether a standard offer exists. |

### Section 6 — Your support

| Code | Key | Copy |
|---|---|---|
| `SI2` | `T2H-SI2-HELP` | Count only training you could run next month using material you already have. Training you intend to build does not count. |
| `SI6` | `T2H-SI6-HELP` | Answer honestly rather than optimistically. This is one of the answers behind your Support score, and an inflated figure makes that score describe a business you do not have. |

### Section 7 — Your role

| Code | Key | Copy |
|---|---|---|
| `FL5` | `T2H-FL5-HELP` | *§3.3 above* |

### Section 8 — Legal

| Code | Key | Copy |
|---|---|---|
| `G4` | `T2H-G4-HELP` | Franchising needs an entity that can legally grant rights and collect royalties — usually a private limited company or an LLP. A sole proprietorship generally cannot. If you are not sure what you are registered as, choose "I don't know". It is a common answer and the Report will tell you what it means for you. |
| `G5` | `T2H-G5-HELP` | For your category this may include FSSAI, shop and establishment registration, a trade licence, fire NOC, GST and professional tax. "Replicable" means an outlet in another city could obtain the same set without changing how you operate. |

**The other sixteen questions get no help.** They are plain English and a tooltip on every field trains the founder to ignore all of them.

---

## 5. Validation

### Blocking — Next stays disabled

| Field | Rule |
|---|---|
| Every question | A value is present. No exceptions *(T43)* |
| `UE7` EBITDA % | **−100 to 100**, one decimal. **The minus sign must be enterable** — the profitability question offers "Loss-making", so loss-making brands do reach this field. Use `inputmode="decimal"`, not `numeric`: the iOS numeric keypad has no minus key |
| `BP3` Google rating | 1.0 to 5.0, one decimal |
| `BP4` Google reviews | Whole number, 0 and upward |
| `FL5` Days without you | **0 to 90.** The question asks about the last 90 days; nothing above 90 is a possible answer |
| `MR5` Outlets trading | **Whole number, 2 and upward.** The question is only asked when the brand has more than one outlet, so **1 is not a possible answer here** — a founder entering 1 has misread it, or his profile is wrong. `T2V-MR5-ONE` |

### Warning, never blocking

**A contradiction is queried, not refused.** The founder may be telling the truth, and refusing his answer teaches him to give us a false one.

| Key | Copy |
|---|---|
| `T2V-CONTRADICT` | **Worth a second look.** |
| `T2V-CONTRADICT-GO` | **It's correct, continue** |

**The warning must name the earlier answer.** Only one of the two is on screen, so "these two answers" alone tells the founder he has contradicted himself without telling him what with. A heading plus one line per pair:

| Key | Pair | Copy |
|---|---|---|
| `T2V-CONTRA-FL` | `FL4` = *Indistinguishable* with `FL5` = 0 | You said the customer experience doesn't depend on whether you're in the building — and that there were no days in the last 90 when the business ran without you. |
| `T2V-CONTRA-UE` | `UE8` = Loss-making with `UE7` above 15% | You said the business is loss-making, and entered a margin of {n}%. |
| `T2V-CONTRA-BP` | `BP3` above 4.5 with `BP4` under 25 | A {rating} rating from {n} reviews is unusual. Worth checking both figures on your listing. |
| `T2V-MR5-ONE` | `MR5` = 1 | You told us earlier that you run more than one outlet. If that is wrong, go back and change it — your Report is built differently for a single-outlet brand. |
| `T2V-CONTRA-MARGIN` | `UE7` falls **inside** the band `UE02` selected | This is the same figure you gave in the free Audit. There we asked what one outlet earns; here we're asking what the whole company earns after head office costs and your own salary. They are usually different. |

**`T2V-CONTRA-MARGIN` is why the live Audit could be left untouched.** It is the only moment in the product where the two margin questions are told apart, said to the founder at the moment he has conflated them *(T45)*.

### The margin trigger, in full — this is the buildable version

**The old trigger, *"`UE7` identical to the Audit's `UE02`"*, could never fire.** `UE02` is a band and `UE7` is a number; a number is never identical to a band. The rule below replaces it and is the one in `Response-to-Developer-Audit.md`.

| | |
|---|---|
| **Fires when** | `UE7`'s value falls inside the band the founder chose for `UE02` |
| **Band edges** | Upper-bound-inclusive, per D21 — the same `<=` the scoring maps use |
| **Does not fire if** | `UE7` is NULL (*I don't know my margin*) |
| **Does not fire if** | `UE02` is absent — no Audit record against this order |

**It fires on a match, not a mismatch, and that is the whole point.** `UE02` asks what one outlet earns; `UE7` asks what the company earns after head office costs and the founder's own salary. Company EBITDA sits **below** outlet margin for almost every brand, so the two agreeing is the unusual case and the likeliest explanation is that the founder answered the second question with the first one's figure.

**This is also why it fires rarely**, contrary to the concern raised in the developer audit. A brand where the two genuinely coincide has essentially no overhead above outlet level, which is itself worth a conversation.

He sees it, he may proceed, **and we record that he was shown it and continued.** A contradiction a founder confirms is some of the best material in the Report — it is the difference between a self-rating and a fact.

---

## 6. The help page

**One page, opening in a new tab from a link beneath every sub-screen.** It opens safely mid-questionnaire precisely because answers save server-side on every answer *(T32)* — nothing is lost by leaving.

| Key | Copy |
|---|---|
| `T2Q-HELP-LINK` | Help with these questions |

**It is the secondary mechanism, deliberately.** People do not leave a form to read a glossary; the inline `?` is what actually gets used. This page is for the founder who wants to understand the whole thing before he starts, and for the team answering a phone call.

### What it contains

1. **What this Report is, and what it is not.** A diagnostic, not a sales document. It is built to say plainly when a brand is not ready, and that is the product working
2. **Why honesty pays.** The one paragraph that earns the price: a flattering answer buys a flattering Report and a plan that fails
3. **Where to find each number.** The measurement guide — the same sixteen notes as §4, in one place
4. **When you can't answer** — the four labels he actually saw, what each means, and that none is penalised for existing *(T59)*
5. **Terms used.** EBITDA, encumbrance, owner-operator and investor-operator, territory and exclusivity, royalty, replicable
6. **What happens after you finish.** Ronak reviews it; 24 hours; how to correct an answer; the refund boundary
7. **What we do with your answers.** They affect your own result and nothing else

### What it must never contain

- Bands, weights, point values, or which option scores highest
- The seven pillar weights
- Anything about the Roadmap as an upsell. The page is help, not a sales surface
- Any claim about your readiness. It explains the instrument; the Report does the judging

**Most of the material exists.** `How-Tier1-Scoring-Works.md` covers the method honestly without revealing bands; this page is the measurement side of the same story.

---

## 7. What gets recorded

**This reopens `Event-Log-Spec.md`, frozen as v1.0 on 8 October (T30).** Approved 13 October as **Decision T48**. Three changes, no new table, no new endpoint, no third-party tool — the freeze held on scope and tooling and still does.

### `question_answered` gains three fields

```json
{ "code": "UE7", "section": 1, "seq": 1,
  "value": 2, "label": "8.4%",
  "escape": null,
  "computed": true,
  "help_opened": true,
  "ms_since_previous": 41280, "variant": "default" }
```

| Field | Values |
|---|---|
| `escape` | `null` · `"not_applicable"` · `"dont_know"` · `"prefer_not"` |
| `computed` | `true` when the EBITDA calculator produced the figure. Tells us how many founders cannot state their own margin |
| `help_opened` | `true` when the `?` was opened on this field before answering |

**`help_opened` is the one that pays for itself.** It tells us which questions people cannot answer unaided — which is the list of questions to reword in the next version. We are currently guessing at that list; after fifty submissions we will know.

### One new event type — `contradiction_warned`

```json
{ "pair": "FL4_FL5", "values": [5, 0],
  "outcome": "proceeded", "ms_shown": 8200 }
```

`outcome` is `"proceeded"` or `"amended"`.

### `help_page_opened`

Its own event type, documented under Exit. **Fifteen event types now, not thirteen** — this one and `contradiction_warned`:

```json
{ "from_code": "UE7", "section": 1 }
```

### Unchanged

**No personal data in any payload. No overall score in any payload.** Both rules hold exactly as written. `submission_id` remains the only join.

---

## 8. What this does not settle

| | |
|---|---|
| **Tier 1 stays untouched** | Decision T45. No edit to any question, screen or help text on the live Audit. The margin confusion is resolved entirely from the Report side, where the founder answers second |
| **The thin-pillar floor applies to the Report only** | Decision T46. Fewer than three answers in a pillar → no score printed, named "not assessed", excluded from the gap ranking. With nothing skippable this will almost never fire — it is a guard rail. **The free Audit keeps its current behaviour**, which means a case like QB365 (Operational Readiness = 100 from a single answer) remains possible there. Accepted knowingly |
| **Contradiction pairs beyond the four listed** | More will suggest themselves once real submissions arrive. The four here are the ones worth building now |

**`FL5`'s position is settled.** It moves to the head of Section 7 — decision T49, applied in the question source and in `Content-Library-Tier2-Questionnaire.md`.
