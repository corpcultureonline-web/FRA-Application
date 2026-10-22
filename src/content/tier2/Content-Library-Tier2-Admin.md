# Content Library — Screens 8 and 9, the review panel

**Version 1.3 · 14 October 2026**

> **v1.3 — five navigation and confirm strings added to §3**, found missing on the v34 build. **v1.2 — §8 adds sign-in**, which nothing had specified: the panel had a route and no way into it. **v1.1 — the reviewer can now edit the Report's text at approval**, under three conditions. That reversed v1.0 §1 and superseded T67; see T70. The edit-rate view in §4 is what makes it safe.

The internal screens where a Report is read and approved before it reaches a founder. Two people use them: Ronak and Sakthikkumaran, both approvers, plus a read-only team login.

---

## 1. Scope

### What the panel does

| | |
|---|---|
| **Approve and send** | The one primary action. Writes the approval, stops the 24-hour clock, sends the Report |
| **Edit a piece** | The reviewer may rewrite the text of any generated block before approving. **Three conditions, §3** |
| **Return** | Stops the Report with a note saying what is wrong. It leaves the queue; a person deals with it outside the panel |
| **Refund** | Available on any order, at any point. Recorded against the order with who and when |

### What it does not do

No orders module · no founder records · no audit leads · no funnel figures · no Roadmap review · no bulk actions · no search beyond the queue's own filter.

**And within the Report itself:** no adding a block the engine did not generate · no reordering · no deleting a whole section · **no editing the score or the band, anywhere, ever**. Which blocks appear is a decision the engine makes from the scores, and overriding that quietly changes what the Report claims.

**Return still earns its place.** Editing fixes a sentence. It does not fix a Report that is wrong about the brand — if the engine has produced the wrong diagnosis, rewriting the prose would hide that rather than fix it. Return is for those, and the note is how the reviewer says what happened.

---

## 2. Screen 8 — the queue

**Utilitarian, dense, fast.** Not branded, not styled like the customer screens. Ronak will open this several times a day and every extra click compounds.

### Columns

| Column | Content |
|---|---|
| Brand | Brand name. The row's link |
| Submitted | Date and time, IST |
| **Elapsed** | **Hours since submission, against the 24-hour promise.** The most important column on the screen |
| Score | The final number |
| Band | Plain band name — Not Yet Ready · Early Stage · Almost Ready · Ready to Plan · Ready to Scale |
| Status | Below |
| Approved by | Name and time, once approved. Empty until then |

**Sorted by age, oldest first.** Not by submission date descending — the queue's job is to surface what is about to breach, and the oldest item is always the most urgent.

### The elapsed column

| Key | Copy | When |
|---|---|---|
| `T2A-ELAPSED` | {n}h | Under 18 hours |
| `T2A-ELAPSED-WARN` | **{n}h** | **18 hours and over.** Visually flagged |
| `T2A-ELAPSED-BREACH` | **{n}h — past 24** | Over 24 hours |
| `T2A-DELIVERED-IN` | Delivered in {n}h | After approval. The clock stops |

**The 24-hour promise has money behind it.** Miss it and the founder can ask for a full refund even after the Report has been sent *(P15)*. So the flag at 18 hours is a six-hour warning, not decoration, and the breach state must be impossible to miss on a glance.

### Statuses

| Key | Copy |
|---|---|
| `T2A-ST-WAITING` | Awaiting review |
| `T2A-ST-APPROVED` | Approved and sent |
| `T2A-ST-RETURNED` | Returned |
| `T2A-ST-REFUNDED` | Refunded |

### Filters

One row of filters, no search box: **Awaiting review** *(default)* · **Returned** · **Approved** · **Refunded** · **All**.

| Key | Copy |
|---|---|
| `T2A-EMPTY` | Nothing waiting. |
| `T2A-EMPTY-SUB` | Everything submitted has been reviewed. |

---

## 3. Screen 9 — the review detail

**Two columns: the Report on the left, the evidence on the right.** On a narrow window they stack, Report first.

### What is on the screen

**Left — the generated Report**, exactly as the founder would receive it. Not a summary, not an extract. If it is going out under Ronak's name, he reads the thing itself.

**Right — three stacked panels:**

| Panel | Contents |
|---|---|
| **The brand** | Brand name · category · outlets · city · the Audit range they saw · the final score and band · **the current email and WhatsApp number** |
| **Their answers** | All 32, grouped by the eight sections, each with the value given. Escape answers shown as the founder chose them — "I don't know my margin", not a blank |
| **Why each piece fired** | Below |

### "Why each piece fired" is the panel that earns this screen

Every block in the Report comes from the Content Library and fired because a rule matched. **Beside each piece, the rule that put it there.**

> **UE · Band 2** — fired because Unit Economics scored 38.4 *(Band 2 is ≤ 40)*
> **Contradiction block** — fired because FL4 = 5 and FL5 = 0, and the founder was warned and continued

Without this, reviewing a Report means re-reading ten pages and forming a second opinion from scratch. With it, the review is *"does this rule describe this brand?"* — which is a question Ronak can answer in seconds and is the only reason the 24-hour promise is keepable at volume.

**It also carries the contradiction outcomes.** A founder who was shown a warning and continued is holding a confirmed fact rather than a careless answer, and that distinction changes what the Report means. The `contradiction_warned` event records it.

### Flags that need the reviewer's eye

Shown above the Report, not buried in a panel:

| Key | Copy | When |
|---|---|---|
| `T2A-FLAG-DK` | {n} questions answered "I don't know" | Any |
| `T2A-FLAG-DK-LEAD` | **Measurement is this brand's largest gap** — the Report leads on it | 5 or more *(T44)* |
| `T2A-FLAG-NOTASSESSED` | {pillar} not assessed — fewer than three answers | Thin-pillar floor fired *(T46)* |
| `T2A-FLAG-CONTRA` | {n} contradictions confirmed by the founder | Any |
| `T2A-FLAG-MARGIN` | Company margin matches the Audit's outlet margin — the founder may not have distinguished them | `UE7` = `UE02` *(T45)* |

**`T2A-FLAG-MARGIN` is the one worth stopping for.** It is the safeguard behind leaving the live Audit untouched, and the only place anyone checks whether it worked.

### Editing a piece — the three conditions

**1. Every edit is stored as a diff against the library piece, never as a replacement.** Who, when, which piece, what the library produced, what actually went out. The founder receives the edited version; the original stays recoverable.

**2. An edit never flows back into the Content Library.** Rewriting a piece for every future brand is a deliberate act by whoever owns the library, not a side effect of one review.

**3. The score and the band are not editable.** Prose is judgement and the reviewer is the expert. The number is the engine's, and a diagnostic whose number can be adjusted by hand is not a diagnostic.

| Key | Copy |
|---|---|
| `T2A-EDIT` | Edit |
| `T2A-EDIT-SAVE` | **Save** |
| `T2A-EDIT-CANCEL` | Cancel |
| `T2A-EDITED` | Edited |
| `T2A-EDIT-ORIG` | Show the library version |
| `T2A-EDIT-REVERT` | Restore the library version |

**An edited block carries `T2A-EDITED` and stays marked after approval.** A reviewer opening an old Report must be able to see at a glance which sentences were the engine's and which were a person's.

**Why this is allowed, having been refused in v1.0.** The objection was that defects never reach the source: the same bad sentence gets hand-fixed in Report after Report and the library stays wrong. **§4 removes that objection** — every edit is counted, and a piece edited repeatedly is the library telling you which block to rewrite. Instrumented, the workaround becomes the diagnostic.

**The cost, which is real.** Review time goes up — if a sentence *can* be improved, it will be — and the 24-hour promise has money behind it *(P15)*. At two to five Reports a week that is affordable. At twenty it is not, and at that point you are hand-writing a product built to generate. **§4 is how you see which one is happening.**

### Navigation and backing out

| Key | Copy |
|---|---|
| `T2A-NAV-QUEUE` | Reports |
| `T2A-NAV-RATES` | Edit rates |
| `T2A-NAV-BACK` | ← All reports |
| `T2A-CANCEL` | Cancel |
| `T2A-REFUND-DO` | **Refund ₹{amount}** |

**One `T2A-CANCEL` serves all three confirm steps** — approve, return and refund. Three differently-worded escapes on one screen is three things to read where one would do.

**`T2A-REFUND-DO` is the button that moves money**, and it names the amount. `T2A-REFUND` only opens the step. A button that says "Refund this order" in both places means the irreversible one looks identical to the one that just asks.

### The actions

| Key | Copy |
|---|---|
| `T2A-APPROVE` | **Approve and send** |
| `T2A-APPROVE-CONFIRM` | This sends the Report to {email} and {mobile} now. |
| `T2A-RETURN` | Return |
| `T2A-RETURN-LABEL` | What is wrong with it? |
| `T2A-RETURN-SAVE` | **Return it** |
| `T2A-REFUND` | Refund this order |
| `T2A-REFUND-CONFIRM` | Refund ₹{amount} to {brand}. This cannot be undone from here. |

**`T2A-APPROVE-CONFIRM` names the destination, and reads it live.** A founder may have corrected his email on Screen 5 while the Report sat in this queue — that is what the Change link is for. The panel must show the address **as it stands at this moment**, never one cached at submission. Sending to a stale address means the founder receives nothing, which is the failure Screen 5 exists to prevent.

**One primary action, visually.** Approve is the only filled button. Return and Refund are quiet.

---

## 4. The edit-rate view — the thing that makes editing safe

**One small screen, approvers only.** Without it the edit record is write-only, and a write-only audit trail is decoration.

| Column | Content |
|---|---|
| Piece | The library block's id and section |
| Appeared in | How many Reports it fired in |
| Edited in | How many of those were rewritten |
| Rate | The second over the first |
| Last edited | Date, and by whom |

**Sorted by rate, highest first. Flag any piece edited in a third or more of the Reports it appeared in**, with a floor of three appearances so a single bad week does not flag the whole library.

| Key | Copy |
|---|---|
| `T2A-RATE-HEAD` | Which blocks keep getting rewritten |
| `T2A-RATE-SUB` | A block edited often is a block the library gets wrong. Rewrite it at source rather than fixing it every time. |
| `T2A-RATE-FLAG` | **Rewrite this one** |
| `T2A-RATE-EMPTY` | Nothing is being edited often enough to worry about. |

**Read it as two different signals.** One piece at a high rate means that block is badly written — rewrite it. **Most pieces being edited means the library as a whole is not fit**, and that is a bigger problem than any panel can absorb.

---

## 5. Refunds are an action, not a screen

The flow spec implies a refunds list. **There is nothing to list.**

A founder requests a refund by emailing `bd@corpculture.co` or messaging WhatsApp *(Refund Policy §A)*. **Nothing in the product collects refund requests**, so there is no inbound queue — only the act of recording and executing one against an order.

**So: `T2A-REFUND` sits on the detail screen of any order, at any status**, and the queue gets a Refunded filter to see them afterwards. No separate screen.

**It must be available after approval**, not only before. If we miss the 24-hour promise, a founder can have his money back even though the Report was sent *(P15)*.

---

## 6. Two roles, and what each sees

*(T36, T37.)*

| | Approver — Ronak, Sakthikkumaran | Team — read-only |
|---|---|---|
| Queue | Everything | Everything |
| Detail | Everything | Everything |
| Approve · Edit · Return · Refund | Yes | **Absent — not greyed out** |
| Edit-rate view | Yes | No |

**A disabled button tells a team member they are missing a permission and invites them to ask for it. An absent one tells them this is not their job.**

**Every approve, edit, return and refund records who did it and when**, and the queue shows it. That record is the evidence behind a money decision — the approval timestamp *is* the refund boundary *(P15)* — so the approver logins are personal and never shared. The team login may be shared while it stays read-only.

### The named-reviewer boundary, made observable

The customer-facing copy says Ronak reads and signs off every Report *(T39)*, and that holds while he is genuinely the default — Sakthikkumaran approving in his absence is applying Ronak's standard, not replacing it.

**The Approved by column is what makes that checkable.** If the record shows Sakthikkumaran approving most Reports, the sentence on the landing page has stopped being true and the copy changes. That is an observable fact rather than a judgement, and this column is where it is observed.

---

## 7. Rules

**This panel is not a customer surface and must not be designed like one.** No hero, no generous whitespace, no brand photography. Density is the feature.

**An edit is a sentence, not a diagnosis.** If the Report is wrong about the brand rather than badly worded about it, return it. Rewriting the prose around a wrong finding hides the fault instead of fixing it, and the founder is the one who pays for that.

**The score is shown but never editable.** Not in this panel, not anywhere. It comes from the engine.

**Two reviewers must not drift.** The Content Library's authority is why two founders with the same answers get the same Report. Editing is permitted because it is recorded and counted — if it stops being either, it stops being permitted.

**Times are IST**, and elapsed is measured from submission, not from payment.


---

## 8. Sign-in

**`manage.corpculture.co` had a route and no way into it.** Nothing in any document said how the three accounts get in.

### The three accounts

| Email | Role | Shared? |
|---|---|---|
| `sakthi@corpculture.co` | Approver | **Never.** Personal |
| `ronak@corpculture.co` | Approver | **Never.** Personal |
| `bd@corpculture.co` | Team, read-only | May be shared *(T37)* |

**No sign-up. No account creation in the panel.** Three rows, seeded by the developer. A fourth person means a fourth row and a deliberate decision, not a form.

### How they get in

**A magic link establishes the session; a long session cookie keeps it.** This reuses the auth already built for the founder side *(T6, T12)* rather than adding passwords, hashes, a reset flow and three people's password hygiene.

| | Session |
|---|---|
| Approvers | **30 days.** In practice they sign in about monthly |
| Team | **7 days** |

**The team session is shorter because that login may be shared.** A thirty-day session on a shared account sitting on someone's laptop is a wider opening than a read-only view needs.

**A link each time would be unusable here.** Ronak opens this several times a day; an email round-trip per visit is fine for a founder who signs in twice in his life and miserable for a daily tool. The long session is what makes magic-link auth workable for an internal panel.

### The copy

| Key | Copy |
|---|---|
| `T2A-LOGIN-HEAD` | Corporate Culture review |
| `T2A-LOGIN-SUB` | Sign in with your work email. We'll send you a link. |
| `T2A-LOGIN-LABEL` | Your email |
| `T2A-LOGIN-BTN` | **Send me a link** |
| `T2A-LOGIN-SENT-HEAD` | Check your email. |
| `T2A-LOGIN-SENT-SUB` | If that address has access, a sign-in link is on its way. It works once and expires in 15 minutes. |
| `T2A-LOGIN-EXPIRED-HEAD` | That link has expired. |
| `T2A-LOGIN-EXPIRED-SUB` | Links last 15 minutes and work once. |
| `T2A-LOGIN-EXPIRED-BTN` | **Send a new link** |
| `T2A-SIGNEDOUT-HEAD` | Signed out. |
| `T2A-SIGNEDOUT-BTN` | **Sign in again** |
| `T2A-SIGNOUT` | Sign out |

**`T2A-LOGIN-SENT-SUB` says "if that address has access" deliberately.** The same confirmation shows whichever address is typed, so the page never reveals which emails are accounts. One line of care, no extra build.

### Boards

Request a link · link sent · link expired · signed out. All four small, all desktop-first — nobody reviews a Report on a phone.

### Rules

**No password anywhere**, so no "forgot password", no reset flow, no strength meter.

**Signing out is available but not prominent.** On a shared team login it matters; on a personal approver login it is used once a year.

**The panel is not indexed and not linked from anywhere.** `noindex`, and no link to it from `app.corpculture.co` or the marketing site.
