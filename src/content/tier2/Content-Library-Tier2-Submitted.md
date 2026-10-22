# Content Library — Tier 2 Screen 5, Submitted

**Version 1.2 · 15 October 2026**

> **v1.2** — `T2S-WHEN` and `T2S-STILL` promised a bare "24 hours", contradicting the Terms and the Refund Policy, which both limit it to working days *(Design, v44)*.

> **v1.1** — three gaps found by Design on the v31 build: no way out of Change without saving, no error strings, and no spoken label on the Change link. All four strings added below, plus the send-time rule in §7.

Every string on the screen a founder sees the moment he taps **Finish and send**.

---

## 1. What this screen is for

**It is the most engaged moment in the funnel and the emptiest.** He has paid ₹2,359, answered thirty-two questions over about fifteen minutes, and now has nothing in his hands. Everything he bought arrives tomorrow.

**One job: make the wait feel safe.** Confirm it landed, name the person holding it, say when it comes back, and show where it will arrive so a typo is catchable now rather than discovered tomorrow when nothing turns up.

**Do not fill the wait with content.** Anything useful enough to put here either gives away the Report or is padding, and both are worse than a short confident page. *(Screen Flow Spec §3, Screen 5.)*

---

## 2. The flow spec is out of date on this screen — the Report goes to two places

`Tier2-Screen-Flow-Spec.md` is dated **8 October** and says to show *"the email address it will go to"*. **T40, T41 and T42 landed on 12 October** and added a mobile number at checkout, a WhatsApp opt-in, and delivery over the WhatsApp Business API.

**So the Report now arrives by email and on WhatsApp, and Screen 5 must show both.** Showing only the email would leave the number he typed four minutes earlier unconfirmed and uncorrectable.

---

## 3. The copy

| Key | Copy |
|---|---|
| `T2S-HEAD` | That's everything. |
| `T2S-SUB` | Your answers are in, and nothing more is needed from you. |
| `T2S-REVIEWER` | **Ronak Patel reads and signs off every Report before it reaches you. Yours is with him now.** |
| `T2S-WHEN` | It comes back within 24 hours on working days. |
| `T2S-WHERE-LABEL` | We'll send it to |
| `T2S-WHERE-EMAIL` | *{email}* |
| `T2S-WHERE-PHONE` | *{mobile}* on WhatsApp |
| `T2S-CHANGE` | Change |
| `T2S-CLOSE-OK` | You can close this page. Nothing is lost. |

### Correcting a wrong address — build it inline, do not link it out

| Key | Copy |
|---|---|
| `T2S-CHANGE-EMAIL-LABEL` | Where should we send it? |
| `T2S-CHANGE-PHONE-LABEL` | Which number is on WhatsApp? |
| `T2S-CHANGE-SAVE` | **Save** |
| `T2S-CHANGE-CANCEL` | Cancel |
| `T2S-CHANGE-DONE` | Updated. |

**`T2S-CHANGE-CANCEL` sits beside Save, quieter.** Without it, saving an unchanged value is the only way out of a row the founder opened by mistake — and a founder who taps Change on the wrong row then has to re-type a value he never meant to touch. Tapping outside is not enough on its own: he opened the field deliberately, so he is owed a deliberate way to close it.

### Errors

| Key | Copy |
|---|---|
| `T2S-PHONE-ERR` | Please enter a 10-digit mobile number. |
| `T2S-EMAIL-ERR` | That email address doesn't look right — check it and try again. |

**Both are deliberate reuses, not new copy.** `T2S-PHONE-ERR` is the same sentence as the checkout's `T2C-MOBILE-ERR`, and `T2S-EMAIL-ERR` is the sentence the live free Audit already shows. A founder who mistypes an email twice in one journey should meet the same sentence both times; two different phrasings for one mistake reads as two different products.

**The developer copies the live Audit's email error string from the running page, not from here.** This file records the intent to match it. If the live wording differs by so much as a comma, the live wording wins and this entry is corrected to match — never the other way round, because the Audit's version is already in front of customers.

### Spoken labels

| Key | Copy |
|---|---|
| `T2S-CHANGE-A11Y-EMAIL` | Change email address |
| `T2S-CHANGE-A11Y-PHONE` | Change WhatsApp number |

Two Change links sit on the page and the word alone says nothing about which is which. Same pattern as `T2Q-HELP-A11Y`.

**This is the one place on Screen 5 worth spending build on.** A wrong email means a founder who paid ₹2,359 receives nothing, cannot be told by email that his email is wrong, and becomes a refund and a bad conversation. He typed the address at the start of the free Audit, twenty-five minutes ago, and the number at checkout four minutes ago — this is the last moment either is cheap to fix.

**A `Change` link beside each, opening one field in place.** Not a settings page, not an account area, not a WhatsApp message to the team. Two fields, a Save, done.

---

## 4. The returning state — same URL, after the Report is ready

He may come back to this page before the Report arrives, or after. **The URL does not change**, so the page has two states.

| Key | Copy | When |
|---|---|---|
| `T2S-STILL` | Still with Ronak. It comes back within 24 hours on working days. | Submitted, not yet approved |
| `T2S-READY-HEAD` | Your Report is ready. | Approved and sent |
| `T2S-READY-BTN` | **Open your Report** | Approved and sent |

**The ready state replaces the whole page**, not a banner added to it. A founder returning after the Report exists should not have to read a waiting message to find the link.

---

## 5. What must not appear

- **No price, no receipt, no invoice.** Those belong in the email. Showing the amount again at the moment he has nothing in hand invites a second thought about it
- **No Roadmap, no upsell, no "what's next".** The Roadmap is offered after the Report, never before *(P4)*
- **No progress bar, countdown or "preparing your Report…" animation.** Nothing is being processed — a person is reading it, and a fake progress indicator is a lie about what is happening
- **No feedback request, no rating, no survey**
- **No social share**
- **Nothing to read while you wait.** No tips, no articles, no "while you're here". *(Screen Flow Spec is explicit on this)*
- **No link back to the Audit result.** He has it. Sending him backwards from the most forward moment in the funnel is the wrong direction

---

## 6. States Design must draw

| State | What happens |
|---|---|
| Arrived from Finish | The full page. `T2S-HEAD` through `T2S-CLOSE-OK` |
| Changing an address | One field open in place, Save beside it. The other address stays as it is |
| Address saved | `T2S-CHANGE-DONE` briefly, then the new value in place. Never a modal |
| Returned, still waiting | `T2S-STILL` in place of `T2S-WHEN`. Everything else unchanged |
| Returned, Report ready | `T2S-READY-HEAD` and `T2S-READY-BTN`. The waiting copy is gone, not greyed out |

---

## 7. Rules

**The reviewer claim is the same claim as the landing page and the help page.** `T2L-REVIEWER-LINE`, `T2HP-AFTER-REVIEW` and `T2S-REVIEWER` all say that Ronak reads and signs off every Report and none goes out automatically. **The wording may differ to suit the surface; the claim may not.** *(T39, T61.)*

**The full name is used here**, as on the help page. This screen has no credentials block to introduce him.

**24 hours is a promise with money behind it.** If we miss it and the founder asks, he gets a full refund *(P15)*. Do not soften it to "usually" or "within a day or two", and do not harden it with a countdown.

**"On working days" is not a softener and must not be dropped** *(Design, v44)*. The Terms and the Refund Policy both limit the promise to working days; this screen said a bare "24 hours". **A founder who submits on a Friday night reads the unqualified version here and has a refund claim on Monday built entirely out of our own wording.** Two words close it.

*A better version exists and is not required today: the screen knows when he submitted, so it could say "It comes back by Monday evening" instead of asking him to apply the rule himself. Worth doing when there is time.*

**Customer-facing names are the Audit, the Report, the Roadmap.** Never "Tier 1/2/3" *(P17)*.

**The Report goes to the address as it stands when it is sent, not as captured at submission.** A founder may correct his email while the Report is still with Ronak — that is the entire point of the Change link. If the send reads a value cached at submission time, the correction is silently discarded and he receives nothing, which is the exact failure this screen exists to prevent. **The admin panel shows the current address at the moment of approval**, so Ronak is never looking at a stale one.
