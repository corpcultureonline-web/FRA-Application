# Content Library — the system messages

**Version 1.2 · 16 October 2026**

> **v1.2** — every marker closed. Sender, WhatsApp number, providers and refund timing supplied 16 October; the resume route is approved and in `CANONICAL-VALUES.md` §4.

> **v1.1** — §2 said three WhatsApp messages; there are two. §12 adds both as submission-ready Meta templates.

Every email and WhatsApp message the product sends. **Six messages, two channels, and one proposal in §10 that needs your ruling.**

Written because Design found that several screens promise a message and no file defined its words *(Design, v42)*. **Without this, the developer writes the copy himself**, at payment, abandonment and delivery — the three moments that decide whether a founder trusts us.

---

## 1. The rules, before any copy

**These are the same product as the screens.** Same voice, same names, same promises. A founder who reads a warm, plain-spoken Report page and then gets a templated transactional email has met two companies.

| | |
|---|---|
| **Names** | The Audit, the Report, the Roadmap. **Never Tier 1/2/3** *(P17)* |
| **Prices** | From `CANONICAL-VALUES.md` §1. Never literals |
| **Delivery promise** | *"within 24 hours on working days"* — **the qualifier is never dropped** *(T73, and the v44 near-miss)* |
| **The Roadmap** | **Appears in no message before the Report is delivered** *(P4)*. Not a footer, not a P.S. |
| **Claims** | Nothing about customers, volumes or outcomes until a record supports it |
| **Punctuation** | Straight quotes and apostrophes, as everywhere else |

**Every message is plain text first.** If an HTML version exists it adds layout, never words. Many founders read these on a phone, through a preview pane, in a hurry.

### What never goes in a message

- **No tracking pixel.** The event log already records link clicks and opens, and that is disclosed in the Privacy Policy. An invisible read-receipt is not
- **No "do not reply".** Every message comes from an address a human reads
- **No unsubscribe on transactional messages.** These are not marketing; adding one invites a founder to opt out of his own Report
- **No attachments**, except the invoice on the receipt. The Report travels as a link, and the PDF is downloaded from the page

---

## 2. Two channels, and why they are not the same message

**Email carries the detail. WhatsApp carries the link and gets out of the way.**

A WhatsApp message is read on a lock screen, in a thread next to family and suppliers. **Three lines is the ceiling.** Anything longer is scrolled past, and a wall of text in that context reads as a marketing blast whatever it says.

**WhatsApp Business API messages need Meta's approval before they can be sent** — this is a launch dependency nobody has tracked. Business-initiated messages must use a template submitted in advance, in the **utility** category, with variables as `{{1}}`, `{{2}}`. **Approval is not instant and templates get rejected for wording.** The three WhatsApp messages below are written to pass: utility in tone, no promotional language, no price in the body.

**Submit them the day the WhatsApp provider is chosen**, not the week of launch.

---

## 3. The receipt — email only

**Sent on `payment_succeeded`.** Its job is to connect two names before a founder sees the second one on his statement.

| Key | Copy |
|---|---|
| `T2M-RCPT-SUBJ` | Your Franchise Readiness Report — payment received |
| `T2M-RCPT-HEAD` | Payment received. Thank you. |
| `T2M-RCPT-BODY` | We've received {amount} for your Franchise Readiness Report. Your tax invoice is attached. |
| `T2M-RCPT-ENTITY` | **Corporate Culture is a brand of Blue Bird Ventures.** Your bank or UPI statement will show **Blue Bird Ventures**. |
| `T2M-RCPT-NEXT` | You're on the questionnaire now. Once you send your answers, Ronak Patel reviews your Report and it comes back within 24 hours on working days. |
| `T2M-RCPT-HELP` | Anything at all — reply to this email. |

**`T2M-RCPT-ENTITY` is the reason this email exists** *(Checkout §4)*. A founder who cannot connect "Corporate Culture" to "Blue Bird Ventures" raises a chargeback instead of asking a question, and the cheapest place to prevent that is the receipt he reads before the statement arrives.

**This email carries no resume link.** See §4.

---

## 4. The resume link — email only

**Sent at the start, before the first answer** *(T32)*. Not on abandonment: by the time someone abandons, we may have no way to reach him that he will open.

| Key | Copy |
|---|---|
| `T2M-RESUME-SUBJ` | Your link back to the questionnaire |
| `T2M-RESUME-HEAD` | Here's your way back in. |
| `T2M-RESUME-BODY` | You don't need this unless you stop partway. Your answers save as you go, and this link picks up exactly where you left off. |
| `T2M-RESUME-BTN` | **Continue the questionnaire** |
| `T2M-RESUME-PRIVATE` | This link is yours — it opens your answers, so please don't forward it. |

### Why this is a second email and not part of the receipt

**Two emails inside a minute is poor, and combining them is worse.** A receipt is a document a founder forwards — to his accountant, to a partner, into an expenses folder. **A resume link opens his half-finished answers and lets whoever holds it change them.**

Putting a private link inside the one message designed to be forwarded is the same mistake T21 exists to prevent on the Report. **The receipt is forwardable and carries no link; this one is private and carries nothing worth forwarding.**

**Make the subject lines obviously different**, so neither looks like a duplicate of the other.

---

## 5. The Report is ready — email and WhatsApp

**The most important message the product sends.** He paid ₹2,359 a day ago and has been waiting.

### Email

| Key | Copy |
|---|---|
| `T2M-READY-SUBJ` | Your Franchise Readiness Report is ready |
| `T2M-READY-HEAD` | Your Report is ready. |
| `T2M-READY-BODY` | Ronak has read it and signed it off. It covers all seven areas, with your gaps ranked by what each one costs you. |
| `T2M-READY-BTN` | **Open your Report** |
| `T2M-READY-PRIVATE` | **This link is private to you.** It carries every answer you gave us, so please don't forward it — download the PDF from the page and send that instead. |
| `T2M-READY-HELP` | Questions about anything in it? Reply to this email and it reaches us directly. |

### WhatsApp

| Key | Copy |
|---|---|
| `T2M-READY-WA` | Your Franchise Readiness Report is ready, {name}. Ronak has read it and signed it off.<br><br>{link}<br><br>The link is private to you — please don't forward it. There's a PDF on the page to send instead. |

**`T2M-READY-PRIVATE` is not boilerplate and must survive editing.** It says the same thing as `T2R-PRIVATE` on the page and the landing FAQ; if the message omits it, the founder forwards the link before he ever reaches the page that would have told him not to.

**The link carries its channel**, so `report_link_clicked` records email or WhatsApp *(Event Log §4.3b)*. **Same destination, different parameter** — never two different links, which would let the two messages drift apart.

**No Roadmap in this message.** The Roadmap is offered in Section 10 of the Report, after he has read it *(P4)*. A Roadmap button in the delivery email sells before he has seen what he already paid for.

---

## 6. A fresh resume link — email and WhatsApp

**Sent from Screen 7's expired state.** It goes to the address on the order, never to one typed on the page *(Resume §4)*.

| Key | Copy |
|---|---|
| `T2M-RELINK-SUBJ` | Your new link to the questionnaire |
| `T2M-RELINK-HEAD` | Here's a fresh link. |
| `T2M-RELINK-BODY` | Your answers are safe — nothing was lost. This link opens them where you left off. |
| `T2M-RELINK-BTN` | **Continue the questionnaire** |
| `T2M-RELINK-WA` | Here's a fresh link to your questionnaire, {name}. Your answers are safe — nothing was lost.<br><br>{link} |

**"Your answers are safe" comes first in both**, as it does on the screen. He clicked a dead link on something he paid for and assumes the worst inside half a second.

---

## 7. Refund confirmation — email only

**Sent on `refund_issued`.** Deliberately plain: a founder getting money back wants confirmation, not warmth.

| Key | Copy |
|---|---|
| `T2M-REFUND-SUBJ` | Your refund has been processed |
| `T2M-REFUND-HEAD` | Your refund is on its way. |
| `T2M-REFUND-BODY` | We've refunded {amount} to the card or account you paid from. Banks usually take **five to seven working days** to show it. |
| `T2M-REFUND-ENTITY` | It will appear from **Blue Bird Ventures**, the same name as the original payment. |
| `T2M-REFUND-NOTHING` | Nothing further is needed from you. |
| `T2M-REFUND-HELP` | If it hasn't arrived after seven working days, reply to this email and we'll chase it. |

**`T2M-REFUND-ENTITY` prevents the second confusion.** He is already watching his statement; a credit from an unfamiliar name restarts the problem the receipt solved.

**No "sorry to see you go", no reason survey, no win-back offer.** He asked for his money back and got it. **Anything else turns a clean refund into a bad review.**

*Five to seven working days confirmed against the Razorpay dashboard, 16 October.*

---

## 8. The review-panel sign-in link — email only

**Staff, not customers.** Sent when Sakthikkumaran, Ronak or the team address requests a sign-in link *(Admin §8)*.

| Key | Copy |
|---|---|
| `T2M-SIGNIN-SUBJ` | Your sign-in link |
| `T2M-SIGNIN-HEAD` | Sign in to the review panel |
| `T2M-SIGNIN-BTN` | **Sign in** |
| `T2M-SIGNIN-EXPIRY` | This link works once and expires in 15 minutes *(T79)*. |
| `T2M-SIGNIN-IGNORE` | Didn't ask for this? Ignore it — nobody can sign in without the link. |

**`T2M-SIGNIN-IGNORE` is a security message, not a courtesy.** An unexpected sign-in link is the first sign someone is trying the address, and the line tells the recipient what to do and what not to worry about.

**This message holds no customer data** — no brand name, no order, no score. It is the one message that may reach a shared inbox *(`bd@corpculture.co`)*.

---

## 9. What the developer must not do

**Do not write any of this copy.** If a message is needed that is not in this file, it comes back here first.

**Do not add a footer with marketing links.** The only footer is the entity line and a reply address.

**Do not merge messages to reduce sends.** §4 explains why the two start-of-journey emails stay apart; the same reasoning applies to anything else that looks mergeable.

**Do not send the Report as an attachment.** It goes as a link so that `report_opened` and `report_section_read` exist at all, and because the PDF is the forwardable copy the founder chooses to send.

---

## 10. The message that does not exist yet — needs your ruling

**If we miss the 24-hour promise, nothing tells the founder.** He discovers it by waiting, and the first he hears from us is after he complains.

**I think there should be a seventh message, sent automatically when an order passes the 24-hour mark unapproved**, saying plainly that we are late, that the refund stands, and when it will arrive. Draft:

> **Subject:** Your Report is late — here's where it stands
>
> Your Report hasn't reached you inside the 24 hours we promised, and that's on us.
>
> It's with Ronak now and you'll have it by {time}. If you'd rather not wait, reply to this email and we'll refund you in full — that's the promise and it stands.

**Why it is worth it.** The admin queue already flags at 18 hours and breaches past 24 *(Admin §2)*, so the system knows before the founder does. **A founder who is told is a founder who usually waits. A founder who discovers it writes the review.**

**Why it is your call and not mine.** It commits us to admitting lateness in writing and offering money back unprompted, which will cost refunds we might otherwise have kept. That is a commercial decision.

---

## 11. Before this ships

| What | |
|---|---|
| **Sending address** | `bd@corpculture.co` |
| **Display name** | `Corporate Culture` — the brand, not a person |
| **WhatsApp Business number** | `8072830857` (send as `+918072830857`) |
| **WhatsApp provider** | **Zoho**, as BSP, via Marketing Automation |
| **Email provider** | **Zoho ZeptoMail** |
| **Refund timing** | Five to seven working days, confirmed |
| **The §10 ruling** | **Declined, 16 October.** No late-Report message |

**Reply-to must reach a person.** Four of these messages invite a reply, and every one of those invitations is a promise.


---

## 12. The WhatsApp templates, ready to submit

**Two templates. Both Utility, never Marketing** — a transactional message filed as Marketing can be blocked by the recipient's settings, and your Report delivery would fail silently for those founders.

**Meta's rules these are written to satisfy:** the body never begins or ends with a variable, no two variables sit adjacent, and nothing reads as promotional. **Every variable needs a sample value at submission or the template is rejected unread.**

### Template 1 — the Report is ready

| Field | Value |
|---|---|
| **Name** | `report_ready` |
| **Category** | **Utility** |
| **Language** | English |
| **Header** | *(none)* |

**Body**

```
Your Franchise Readiness Report is ready, {{1}}. Ronak has read it and signed it off.

The link below is private to you - please don't forward it. There is a PDF on the page you can send instead.
```

**Footer** — `Corporate Culture, a brand of Blue Bird Ventures`

**Button** — Call to action · Visit website · **Dynamic**
- Button text: `Open my Report`
- URL: `https://app.corpculture.co/franchise-audit/report/my/{{1}}`

**Samples for review:** body `{{1}}` = `Ravi` · URL `{{1}}` = `a1b2c3d4e5f6`

### Template 2 — a fresh questionnaire link

| Field | Value |
|---|---|
| **Name** | `questionnaire_resume_link` |
| **Category** | **Utility** |
| **Language** | English |
| **Header** | *(none)* |

**Body**

```
Here is a fresh link to your questionnaire, {{1}}. Your answers are safe - nothing was lost.

The link below opens them exactly where you left off.
```

**Footer** — `Corporate Culture, a brand of Blue Bird Ventures`

**Button** — Call to action · Visit website · **Dynamic**
- Button text: `Continue`
- URL: `https://app.corpculture.co/franchise-audit/report/resume/{{1}}`

**Samples for review:** body `{{1}}` = `Ravi` · URL `{{1}}` = `a1b2c3d4e5f6`

### Both templates are ready to submit

**The resume route is approved and recorded** in `CANONICAL-VALUES.md` §4 as `app.corpculture.co/franchise-audit/report/resume/{token}` *(16 October)*. It had been missing while Screen 7 was drawn and signed off against it.

*The number is clear of the consumer app and already onboarded with Meta and Zoho, confirmed 16 October.*

**The em dashes are deliberately hyphens.** Template review is mechanical and an en or em dash occasionally trips it. The screens keep their proper dashes; these two messages do not.

### There is no third template

**§10's late-Report message was declined on 16 October.** Two templates is the whole set.

**Worth knowing what that means in practice:** if a Report runs past 24 hours, nothing reaches the founder. He finds out by waiting, and the first we hear is when he asks. The admin queue flags at 18 hours *(Admin §2)*, so **somebody watching the queue can send a message by hand** — which is the fallback this decision leaves in place.
