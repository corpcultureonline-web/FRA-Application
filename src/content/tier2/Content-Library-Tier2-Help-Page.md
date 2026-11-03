# Content Library — the Report help page

**Version 1.3 · 15 October 2026**

> **v1.3** — `T2HP-WHAT-2` claimed *"roughly half the brands who complete it are told they are not ready yet"*. **We have no Tier 2 customers, so that is a claim about buyers who do not exist.** Rewritten as the instrument's design intent, which is true today and does the same job.

> **v1.1** — two points raised by Design on the v27 build. `T2HP-HONEST` now separates being torn between options from not having a figure; the reviewer line keeps the full name, and the rule about matching the landing page is restated as a rule about the claim rather than the characters.

Every string on the help page. It opens in a new tab from `T2Q-HELP-LINK` beneath every questionnaire sub-screen, and it is safe to open mid-questionnaire because answers save server-side on every answer *(T32)*.

---

## 1. The one rule

**It explains what to measure. It never explains how answers score.**

No bands, no weights, no point values, nothing about which option is better. A founder who works out that one answer scores higher than another stops telling the truth, and the Report is only worth ₹1,999 because the answers are honest.

**Also absent:** any mention of the Roadmap, and any claim about this founder's readiness. The page explains the instrument. The Report does the judging.

---

## 2. Section 4 is four rows, not three — corrected

Design built the escape section with three label slots. **There are four labels**, because `BP3`/`BP4` and `UE7` carry their own wording rather than a generic "not applicable".

The internal names — not applicable, don't know, prefer not — stay in `Content-Library-Tier2-Field-Help.md` §2, which is ours. **A founder is shown only what he saw on the form.**

**Heading changes from "The three answers for when you can't answer" to "When you can't answer".** Twenty-five slots, not twenty-four.

---

## 3. The copy

### Page title

| Key | Copy |
|---|---|
| `T2HP-HEAD` | Help with these questions |

### Section 1 — What this Report is, and what it is not

| Key | Copy |
|---|---|
| `T2HP-WHAT-1` | The Franchise Readiness Report is a diagnostic. It measures how ready your business is to be franchised across seven areas, and it is built entirely from your own answers. It is not a valuation, not a business plan, and not a document written to be shown to investors. |
| `T2HP-WHAT-2` | It is not a sales document either. It is built to tell you plainly when you are not ready — that is the Report working, not failing. Finding out now costs you about fifteen minutes. Finding out after you have signed a franchisee costs a great deal more. |

### Section 2 — Why honesty pays

| Key | Copy |
|---|---|
| `T2HP-HONEST` | Nobody checks these answers against your books, so you could make the business look better than it is. The only person that misleads is you. A flattering answer buys a flattering Report and a plan built on a business that does not exist — and the gap turns up later, in front of a franchisee who has already paid you. Where you are torn between two options, pick the less flattering one. And where you simply do not have a figure, say so — there is an answer for that on the questions where it applies. A guess dressed up as a number is worse than an honest gap. |

**Two kinds of "unsure", and they get different advice.** Being torn between two option sentences is a judgement call, and the honest move there is the less flattering one. Never having calculated your margin is not a judgement call — it is a missing fact, and guessing at it corrupts the one pillar it feeds. The earlier wording said only *"where you are unsure, answer low"*, which told a founder who had never worked out his EBITDA to invent a low number instead of using the answer built for him. **Corrected 13 October**, raised by Design.

*"Less flattering" rather than "lower" is deliberate — it says what we mean without implying a rank, and nothing on this page may suggest how answers score.*

### Section 3 — Where to find each number

| Key | Copy |
|---|---|
| `T2HP-NUMBERS-INTRO` | Several questions ask for a figure rather than an opinion. These are the ones founders most often get wrong — rarely from dishonesty, usually because the number was never worked out, or because the question means something slightly different from what it sounds like. Each note below also sits beside its own question, behind the question mark. |

*The sixteen notes follow, verbatim from `Content-Library-Tier2-Field-Help.md` §4. They are already placed on the board. **Do not reword them here** — the same strings appear on the form, and a founder who reads one in each place must read the same sentence twice.*

### Section 4 — When you can't answer

| Key | Copy |
|---|---|
| `T2HP-ESC-INTRO` | Some of these questions will not apply to you, and some you will not be able to answer. Both are fine, and neither counts against you — but they do different things to your result, so pick the one that is actually true. |

**Four rows. Left column is the label exactly as it appears on the form.**

| Label he saw | Key | What it means |
|---|---|---|
| We don't have a Google listing | `T2HP-ESC-GOOGLE` | The question is left out of your result entirely. Your Report will say that your brand's public review record could not be looked at, because for a brand about to sell franchises that absence is worth knowing. |
| I don't know my margin | `T2HP-ESC-MARGIN` | We will not put a number in for you. Your Report records that you were not able to state it — which, for a business preparing to take money from a franchisee or a lender, is a finding in its own right. |
| I don't know | `T2HP-ESC-DK` | The same, on the three legal questions. Your Report notes it rather than guessing, and tells you how to find out. |
| Prefer not to answer | `T2HP-ESC-PN` | Left out of your result entirely. Nothing is assumed from it in either direction. |

| Key | Copy |
|---|---|
| `T2HP-ESC-NOPEN` | None of these four lowers your result. What they change is how much of your business the Report was able to see — and it says so, rather than filling the gap with a guess. |

*Supersedes the `T2HP-ESC-NA / -DK / -PN` three-slot structure and their `-D` definition slots.*

### Section 5 — Terms used

| Key | Copy |
|---|---|
| `T2HP-TERM-1` | **EBITDA** — what the business earns before interest, tax, depreciation and amortisation. In plain terms: revenue, minus the cost of running the business including a fair salary for yourself, but before loan repayments, before writing down equipment, and before tax. If you have never worked it out, use the calculator on the question itself. |
| `T2HP-TERM-2` | **Encumbrance** — anything that ties up an asset. A loan secured against property, pledged equipment, a lien. It matters here because a franchisee's money would sit behind it. |
| `T2HP-TERM-3` | **Owner-operator and investor-operator** — an owner-operator runs the outlet personally, day to day. An investor-operator funds it and hires a manager to run it. They need different training, different margins and different support, which is why we ask which one you have chosen. |
| `T2HP-TERM-4` | **Territory and exclusivity** — territory is the area a franchisee is given. Exclusivity is your promise not to open another outlet inside it, including one of your own. |
| `T2HP-TERM-5` | **Royalty** — the continuing share of a franchisee's revenue paid to you, usually monthly and usually a percentage. Separate from the one-off franchise fee paid at the start. |
| `T2HP-TERM-6` | **Replicable** — able to be set up again somewhere else, by someone who is not you, without changing how the business works. |

### Section 6 — What happens after you finish

| Key | Copy |
|---|---|
| `T2HP-AFTER-REVIEW` | Ronak Patel reads and signs off every Report before it reaches you. None goes out automatically. |
| `T2HP-AFTER-24H` | Your Report arrives within 24 hours on working days, by email and on WhatsApp. Submit on a Saturday or Sunday and it reaches you by Monday evening. If we miss that, you can ask for your money back. |
| `T2HP-AFTER-CORRECT` | If you notice a wrong answer after sending, tell us. We will correct it before Ronak reviews your Report. |
| `T2HP-AFTER-REFUND` | You can have a full refund at any point before you submit your answers. Once you submit, the review begins. |

**`T2HP-AFTER-REVIEW` keeps the full name, and that is not a drift from the landing page.**

The landing page's `T2L-REVIEWER-LINE` reads *"Ronak reads and signs off every Report before it reaches you"* — first name only, because it sits directly beneath `T2L-REVIEWER-KICKER` and the two credential lines, so the reader has just been introduced to him. **The help page has no such block.** A founder who opens it mid-questionnaire meets a first name with nothing attached to it.

**What must not drift is the claim, not the characters:** that he reads and signs off every Report, and that none goes out automatically. Both lines say exactly that. *(T39, and the boundary it sets — this holds while Ronak is genuinely the default reviewer.)*

*`T2HP-AFTER-REFUND` is the policy boundary in `Refund-Policy.md` §A (P15) and must not be softened here.*

### Section 7 — What we do with your answers

| Key | Copy |
|---|---|
| `T2HP-DATA` | Your answers produce your Report and nothing else. They are not sold, not published, and not shown to any other brand. The sample Report on our site belongs to a business that does not exist. |

---

## 4. Notes for whoever edits this next

**The sixteen measurement notes are shared strings, not copies.** They appear on the form and on this page. Changing one changes both, and `Content-Library-Tier2-Field-Help.md` §4 is the authority.

**`T2HP-WHAT-2` used to carry a "roughly half" figure and no longer does.** It was an expectation from the band model written as an observation about customers, on a page read by someone who has paid. **Once there is a real distribution it may return as a figure we can show.** Until then, no claim about customers, volumes, outcomes or system behaviour goes on any surface until a record supports it.

**Nothing on this page may become an upsell.** It is the only page a hesitating founder reads mid-questionnaire, which makes it the most tempting place to sell the Roadmap and the worst one. The Roadmap is offered after the Report, never before *(P4)*.
