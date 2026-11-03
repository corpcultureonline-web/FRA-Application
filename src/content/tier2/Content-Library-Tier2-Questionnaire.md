# Content Library — Tier 2 Screen 4, the questionnaire

**Version 1.2 · 13 October 2026**

> **v1.2 — the live Audit was walked through and screenshotted on 13 October, and §3b below was wrong on three counts.** §3b is superseded by `Screen4-Final-Handoff-Design.md` §2.3. The substantive change: **a review screen is added before Finish** *(T51)*, reversing the "no surprise extra step" rule in §6.

> **Companion file: `Content-Library-Tier2-Field-Help.md`.** Field help, the escape answers, the EBITDA calculator, validation and the help page live there. It also carries the only three changes to the question set — reworked stems for `OR3` and `OR4`, and a calculator behind `UE7`.
>
> **v1.1 adds** the no-skip rule *(T43)*, three new keys, and the save-failed line that was a placeholder.

---

## 1. What makes this screen different from the others

**The money is already spent and all the risk is downside.** Nobody abandons at Screen 1 and costs you anything; they were never going to buy. Somebody who abandons here has paid ₹2,359, has nothing to show for it, and becomes a refund and a bad conversation.

**Every other screen is persuading. This one is only removing obstacles.**

---

## 2. Shape

| | |
|---|---|
| Questions | **32 for a single-outlet brand, up to 35.** Fixed by the register — no additions |
| Sections | **Always 8** |
| Sub-screens | About 15, including the review screen |
| Source of the questions | `Tier2-Questionnaire-Strings.md` — the standard single-outlet set. Design does not write or reword a question |

### The eight sections

| # | Section | Questions | Sub-screens |
|---|---|---|---|
| 1 | Your numbers | 4 simple | 1 |
| 2 | Your systems | 2 simple + OR5 anchored | 2 |
| 3 | Your brand | 3 simple + BP5 anchored | 2 |
| 4 | Your market | 4 simple | 1 |
| 5 | Your partners | 4 simple + PP4 anchored | 2 |
| 6 | Your support | 5 simple | 1 |
| 7 | Your role | **FL5 first**, then FL2, FL3, FL4 anchored | **4** |
| 8 | Legal | 3 simple | 1 |

**Six anchored questions: OR5, BP5, PP4, FL2, FL3, FL4.** Each has five options that are full sentences or short paragraphs. **One anchored question per screen, each option a tappable card** — full text visible, generous spacing, clear selected state. No radio buttons, no truncation, no "read more".

### Section 7 is the hardest problem on this screen

**FL2, FL3 and FL4 run back to back** — three anchored questions in a row, at the end, when fatigue is highest and the founder has been answering for twelve minutes.

**Treat it as the hardest problem, not the last one.** If anything here is going to lose a paying customer, it is these four screens.

### FL5 comes first in Section 7 — changed 13 October *(T49)*

**Order: FL5 (numeric), then FL2, FL3, FL4.**

FL5 is the only countable fact in the section: *on how many days in the last 90 did the business run without you present or on call?* The other three ask the founder to rate himself, and the Report trusts FL5 over all three when they disagree.

**Asked last, it was being answered under pressure.** A founder who has just ticked *"Indistinguishable — the customer experience does not depend on whether I am in the building"* then has to put a number beside that claim. If the honest number is 2, writing 2 makes what he just said look foolish — so he rounds up, and we lose the one answer we rely on most.

**Asked first, that pressure does not exist.** He gives the number before he knows what follows, and then rates himself against a figure already on the record — which makes the self-ratings more honest too.

**For the build:** four sub-screens as before, and the pips run FL5 `#...` → FL2 `##..` → FL3 `###.` → FL4 `####`.

---

## 3. The copy

| Key | Copy |
|---|---|
| `T2Q-PROGRESS` | Section {n} of 8 |
| `T2Q-SAVED` | Saved |
| `T2Q-BACK` | Back |
| `T2Q-NEXT` | Next |
| `T2Q-FINISH` | **Finish and send** |
| `T2Q-LEGAL-NOTE` | These stay private and only affect your own result. |
| `T2Q-RESUME-NOTE` | Your answers save as you go. You can close this and come back. |
| `T2Q-SAVEFAIL` | Not saved yet — retrying. |
| `T2Q-HELP-LINK` | Help with these questions |
| `T2Q-ANCHOR-NOTE` | Pick the sentence closest to how things run today, not how you would like them to. |
| `T2Q-ANCHOR-NOTE-FL2` | There is no right answer here. Pick the one that matches your own view. |
| `T2Q-REMAIN` | Answer {n} more questions to continue |
| `T2Q-REMAIN-ONE` | Answer 1 more question to continue |
| `T2Q-ALLSET` | All set — continue when you are ready |
| `T2Q-REVIEW-HEAD` | Check your answers |
| `T2Q-REVIEW-SUB` | Change anything that doesn't look right. This is the last step before your Report. |
| `T2Q-REVIEW-EDIT` | Edit |
| `T2Q-REVIEW-BACK` | **Back to your answers** |
| `T2Q-HELP-A11Y` | Help with this question *(spoken label on the `?` button, never shown)* |

**`T2Q-ANCHOR-NOTE` sits above every anchored option list** — taken from the live Audit, which carries the same instruction. Its second half is the part that matters: *not how you would like them to*. That is the failure mode of every self-rating on this form, and naming it is the cheapest honesty mechanism we have. **`FL2` takes the variant instead**, because it asks about a future intention rather than how things run today.

*It replaces `T2Q-FIVE` ("Five options. Pick the closest."), which is retired — same position, and this line does the job better.*

**`T2Q-REMAIN` / `T2Q-ALLSET` sit above the buttons**, also from the Audit. Nothing is skippable *(T43)*, so a disabled Next needs a reason, and `T2Q-ALLSET` is the only moment on the form that tells the founder he is clear to go on.

**`T2Q-HELP-LINK` appears beneath every sub-screen** and opens the help page in a new tab. It is safe mid-questionnaire only because answers save server-side on every answer *(T32)*.

### Section names, shown as headers

Your numbers · Your systems · Your brand · Your market · Your partners · Your support · Your role · Legal

---

## 3b. Inherit the Audit's interaction patterns — **superseded 13 October**

**The brand system was already inherited** — colours, type, radii, touch targets, breakpoints. **The interaction patterns must be too**: option styling, selected state, how Next behaves, how a section transition feels. *That principle stands.*

**Why it matters more here than anywhere else.** A founder finishes the free Audit, pays, and arrives on this screen minutes later. If the options look different or the navigation behaves differently, it reads as a different product at the exact moment they are most sensitive to having just spent money.

**Everything else that was in this section is withdrawn.** The live Audit was walked through and screenshotted at 390px on 13 October, and three of the claims here were wrong:

| We said | It actually |
|---|---|
| Progress shows 11 questions, "however it currently shows" | Already reads **"Section 1 of 7"**. Screen 4 matches it rather than departing from it |
| No draft — "it is four minutes long" | Displays **"✓ Your answers are saved as you go"**. Whether that is true is open with the developer |
| No review step after the last question | Ends with **"Check your answers"**, every answer editable. Screen 4 now has one too *(T51)* |

**The one real deliberate difference was never recorded here:** the Audit shows a countdown — *"About 4 minutes left"* — and Screen 4 must not. §5 already bans it.

**The authority is now `Screen4-Final-Handoff-Design.md` §2.3 and §7**, with the ten screenshots attached to it. Design no longer needs to be sent screenshots; it has them.

**Screen 4's remaining deliberate differences:** no countdown · its own transient Saved pill rather than the Audit's permanent line · one anchored question per screen with five cards · eight segments with sub-screen pips rather than seven numbered ones.

## 4. Rules that are not negotiable

**Nothing is skippable.** *(Decision T43.)* Next stays disabled until the current question has a value. Where a founder has no input, or the question does not apply to him, he picks an answer that says so — escape answers are specified in the companion file, on **seven questions only, and on none of the six anchored ones.** A blank cannot be told apart from a genuine absence; an answer can. `.btn.off` already exists in Design's CSS and is currently unused — this is what it is for.

**Progress is shown by section, never by question.** *"Section 3 of 8"* reads as manageable; *"question 11 of 32"* reads as a chore. Same information, different feeling — and the question count varies by outlet band anyway, so a fixed total would be wrong for some brands.

**The "Saved" indicator appears after every answer.** *(Decision T34.)* Someone fifteen minutes in on a phone is wondering whether this survives. A founder who cannot see that it is safe will not risk closing the tab — and that is the moment they abandon instead of pausing.

**Answers save server-side on every answer, not at section boundaries.** *(T32.)* Browser storage is not acceptable: it passes every test and then fails the one case this exists for — a crashed browser, a cleared cache, a different phone tomorrow.

**Numeric questions use `inputmode="numeric"`.** Small detail, large effect on a phone.

**Back must work, and must not lose the current answer.** Founders check what they said two questions ago. A Back button that discards is worse than none.

**No progress bar that fills smoothly.** Eight discrete steps. A bar that creeps forward during a four-screen section reads as stalling.

**Mobile first, genuinely.** Design the phone layout and let desktop be the adaptation.

---

## 5. What must not appear

- No price, anywhere. They have paid
- No upsell, no Roadmap mention
- No encouragement copy — *"Great answer!"*, *"Almost there!"*, *"You're doing well"*. This is a diagnostic, and a founder giving honest answers about a weak area does not want to be congratulated for it
- No time remaining estimate that counts down. It is wrong for anyone who pauses, and being told you are behind is the opposite of helpful
- No question numbering visible to the founder

---

## 6. States Design must draw

| State | What happens |
|---|---|
| Answer saved | `T2Q-SAVED` appears briefly, then fades. Never a modal |
| Save failed | `T2Q-SAVEFAIL` as a quiet strip beneath the progress bar, retry automatically, **never block the next question.** Losing one answer is better than stopping the run |
| Next with no answer | Next renders in `.btn.off` and does nothing. No error message, no shake, no toast — the disabled state is the whole explanation *(T43)* |
| Contradiction warned | `T2V-CONTRADICT` inline, with `T2V-CONTRADICT-GO`. He may always proceed. See the companion file |
| Returning via resume link | Lands on the exact question left, with the section header already showing |
| Last question answered | `T2Q-NEXT` leads to the **review screen**. `T2Q-FINISH` appears only there *(T51)*. **This reverses the old "no surprise extra step" rule, deliberately** — the free Audit ends with a "Check your answers" step, so its absence here is the surprise, not its presence |
| Review screen | Eight groups, one per section, every answer in full with `T2Q-REVIEW-EDIT` beside it. Anchored answers are **not** truncated. Long page, no accordions, no pagination |
| Edit from review | Returns to that question's sub-screen with the answer selected. The forward button there reads `T2Q-REVIEW-BACK` and returns to the review screen — it does not walk forward through the rest of the form |
| Section 8 opened | `T2Q-LEGAL-NOTE` shown once at the top of the section |

**Section 8 needs the reassurance line** because these are legal questions and people tense up — trademark status, disputes, entity structure. A founder who thinks a wrong answer gets them into trouble will give a vague one, and vague answers at Section 8 are where the Report's non-negotiables come from.
