# Content Library — Screen 7, Resume

**Version 1.1 · 15 October 2026**

> **v1.1** — `T2RS-TIME` had no formula. Design supplied one on the v37 build and it is adopted below.

The page a founder lands on when he returns to a half-finished questionnaire.

---

## 1. What this screen is for

**It exists because paid runs have a draft and free ones do not** *(T32)*. A founder who has paid ₹2,359 and answered nineteen of thirty-two questions, then closed the tab, gets a link that puts him back exactly where he was.

**One job: prove nothing was lost, then get out of the way.** He is not reading this page; he is passing through it. Every extra second here is a second he is not answering question twenty.

**It is the smallest screen in Tier 2 and the one that saves the most money.** An abandoned paid questionnaire is a refund and a bad conversation; this is what prevents it.

---

## 2. Where the link comes from

**Emailed at the start, before the first answer** *(T32)*. Not on abandonment — by the time someone abandons, we may have no way to reach him that he will open.

**The draft never expires. The link may.** T32 is explicit: a link can be re-issued, a draft cannot be lost. A paid order never expires either, so a founder returning after six months still has his answers.

---

## 3. The copy

| Key | Copy |
|---|---|
| `T2RS-HEAD` | Welcome back, {brand}. |
| `T2RS-PROGRESS` | You answered {n} of {total} questions. |
| `T2RS-SECTION` | You stopped in **{section name}**. |
| `T2RS-SAFE` | Everything you entered is still here. |
| `T2RS-CONTINUE` | **Pick up where you left off** |
| `T2RS-TIME` | About {n} minutes left. |

**`T2RS-SAFE` is the whole point of the page.** He closed a tab twenty minutes into something he paid for, and the question in his head is whether he has to start again. Answer it before he asks.

**`T2RS-HEAD` uses the brand name, not his own.** It is the name he typed, it proves we know who he is, and it reads less like a mail-merge than "Welcome back, Ravi".

**`T2RS-PROGRESS` counts questions here, though the questionnaire itself counts sections.** That is deliberate and it is the one place the rule is inverted: "Section 5 of 8" tells a returning founder nothing about how much is left, while "19 of 32" tells him he is two-thirds done — which is the fact that gets him to continue.

### How `T2RS-TIME` is worked out

**`ceil(remaining × 0.5)` minutes, minimum 1. Hidden entirely at 32 of 32.**

Half a minute a question is the rate Screen 3 already quotes — *"about thirty, roughly 15 minutes"* — so the two screens cannot contradict each other, which they would if this one invented its own pace. Thirteen remaining reads as **7 minutes**.

**Hiding it in the all-answered state is right**: "About 0 minutes left" is absurd, and that state's button goes to the review screen rather than to a question, so there is no remaining work to estimate.

*Formula supplied by Design on the v37 build and adopted unchanged.*

---

## 4. The expired link

**An expired or unrecognised link offers a new one. It never shows an error.**

| Key | Copy |
|---|---|
| `T2RS-EXPIRED-HEAD` | This link has expired. |
| `T2RS-EXPIRED-SUB` | Your answers are safe. We'll send you a fresh link now. |
| `T2RS-EXPIRED-BTN` | **Send me a new link** |
| `T2RS-EXPIRED-SENT` | Sent. Check your email and WhatsApp. |

**"Your answers are safe" comes before anything else**, including the explanation. A founder who clicks a dead link on something he paid for assumes the worst in the first half-second, and the sentence has to reach him inside it.

**It goes to the address on the order**, never to an address typed on this page — otherwise the link is a way for anyone holding it to redirect a paid run.

---

## 5. What must not appear

- **No price, no receipt.** He paid; this is not a transaction screen
- **No Roadmap, no upsell.** He has not finished the Report yet *(P4)*
- **No "why did you leave?"** — no survey, no reason-for-abandonment picker
- **No marketing, no tips, no "while you're here"**
- **No login.** The link is the credential. Asking a founder to identify himself after he has paid and clicked his own link is the fastest way to lose him
- **No countdown or expiry warning on the normal state.** It creates pressure on a page whose entire job is reassurance

---

## 6. States Design must draw

| State | What happens |
|---|---|
| **Returning mid-questionnaire** | The full page. One button |
| **Returning with everything answered but not submitted** | `T2RS-PROGRESS` reads 32 of 32 and the button goes to the **review screen**, not to a question |
| **Expired link** | §4. Reassurance first |
| **New link sent** | `T2RS-EXPIRED-SENT`. Nothing else changes |
| **Already submitted** | Not this page. Goes straight to Screen 5, which already has a waiting state and a ready state |
| **Phone** | 390 and 320. It should fit without scrolling at 390 |

**The "already submitted" case matters more than it looks.** A founder who finished on Monday and clicks his old resume link on Wednesday must not be offered a questionnaire he has already sent. The link resolves against the order's state, not against itself.

---

## 7. Rules

**This page never changes an answer.** It resumes; it does not edit. Corrections go through the review screen or `T2W-FIX`.

**It carries no progress bar.** The questionnaire's own section indicator takes over the moment he continues, and two different progress treatments on consecutive screens read as two different products.

**Customer-facing names are the Audit, the Report, the Roadmap** *(P17)*.
