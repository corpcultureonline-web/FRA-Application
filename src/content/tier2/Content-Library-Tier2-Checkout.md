# Content Library — Tier 2 Checkout (Screen 2)

**Version 1.1 · 15 October 2026**

> **v1.1** — the refund line drops the deadline *(T72)*; a consent checkbox is added *(T75)*; the mobile number moves to our own field *(developer audit item 7)*.

Every user-facing string on the checkout screen. **This file is the single source for all of it.**

Prices render from config — `CANONICAL-VALUES.md` §1 — never as literals.

---

## 1. The principle for this screen

**They have already decided. Do not re-sell.**

Every element added here is an opportunity to reconsider. No feature list, no testimonials, no second call to action, no "why choose us". The landing page did that work; this screen's only job is to take the payment without introducing doubt.

**Two exceptions earn their place:** the trust row, because a founder paying ₹2,359 to a firm they met once wants to see Razorpay before they tap, and the refund line, because it removes the last hesitation rather than creating one.

---

## 2. The copy

| Key | Copy |
|---|---|
| `T2C-HEAD` | Complete your purchase |
| `T2C-ITEM` | The Franchise Readiness Report — one Report, reviewed by Ronak Patel |
| `T2C-PRICE-HEAD` | **₹1,999** + 18% GST |
| `T2C-PRICE-PAY` | ₹2,359 payable |
| `T2C-ENTITY` | Corporate Culture is a brand of Blue Bird Ventures |
| `T2C-NEXT` | After payment you will get a link to your questions, by email and WhatsApp. |
| `T2C-PAY-BTN` | **Pay ₹2,359** |

**`T2C-PAY-BTN` renders the payable total, never the base price.** The number on the button is the number leaving their account. Showing ₹1,999 and then charging ₹2,359 inside Razorpay is the commonest cause of abandonment on an Indian payment page — the figure changes at the exact moment the founder is deciding whether to trust us. The amount is computed from config like every other price; it is never typed.

### The mobile number

The Audit does not collect a mobile number, so this screen asks for it. *(Decision T40.)*

| Key | Copy |
|---|---|
| `T2C-MOBILE-LABEL` | Your mobile number |
| `T2C-MOBILE-WHY` | We send your Report link to this number on WhatsApp, and by email. |
| `T2C-MOBILE-ERR` | Please enter a 10-digit mobile number. |

**`T2C-MOBILE-WHY` is the WhatsApp opt-in** — Decision T41, the one exception to the no-consent-UI rule. It is a single plain line beneath the field, never a checkbox and never a modal. A cookie banner protects us; this tells a paying customer where their Report will arrive, which is information they want.

**The number is taken in our own field and prefilled into Razorpay.** *(Reverses T40; developer audit item 7.)*

T40 said to reuse Razorpay's own phone field. **It cannot be done.** `T2C-MOBILE-WHY` has to sit beneath the field, and that field is inside Razorpay's hosted modal where we cannot place copy. **T32 requires it independently** — the resume link is emailed at start, which needs the number before payment. Two decisions pointing the same way.

### Trust row

Same keys as the landing page, so the two screens cannot drift.

| Key | Copy |
|---|---|
| `T2L-PAY-SECURE` | Payments processed securely by Razorpay |
| `T2L-PAY-METHODS` | UPI, RuPay, Visa, Mastercard and netbanking accepted |
| `T2L-PAY-INVOICE` | GST invoice issued with every purchase |

### Refund

| Key | Copy |
|---|---|
| `T2C-REFUND-LINE` | **Full refund if you change your mind.** |
| `T2L-PAY-REFUND` | Refund policy *(link)* |

**One line above the pay button, with the link.** This is the strongest sentence on the screen and the only one that reduces hesitation rather than adding to it.

**It names no deadline, deliberately** *(T72)*. The boundary — before you submit your answers — lives in the Refund Policy, which the consent checkbox points at. Naming a deadline at the moment of payment creates the pressure the line exists to remove; naming the refund removes it.

### Consent

| Key | Copy |
|---|---|
| `T2C-CONSENT` | I have read the **Terms and Conditions**, **Privacy Policy** and **Refund Policy**. |
| `T2C-CONSENT-ERR` | Please confirm you have read these before paying. |

**Directly above the Pay button.** All three links open in new tabs, which is safe here because Razorpay has not opened yet and nothing is lost.

**Pay stays active.** Tapping it unticked shows `T2C-CONSENT-ERR` against the checkbox. **A disabled Pay button loses the sale** — a founder who missed a checkbox concludes the site is broken and leaves. Screen 4's disable-until-valid pattern is right there and wrong here.

**Stored with the order: ticked, timestamp, and the version of each document in force at that moment** *(T75)*. When the policies change you must be able to say which version this customer accepted.

### Failure

| Key | Copy |
|---|---|
| `T2C-FAIL` | That didn't go through. Nothing was charged. |

Returns to the landing page carrying this one quiet line. **Never a dead end, never an error page, never a code.**

---

## 3. What must not appear

- No feature list or benefits
- No testimonials, logos of other brands, or ratings
- No countdown, scarcity or "limited" anything
- No second call to action
- No upsell to the Roadmap. It is offered after the Report, never before *(P4, and the landing page says so in writing)*
- No cookie banner. **The terms checkbox is not a banner** — see §2. That rule was right about cookie notices and wrong about terms acceptance, which is standard on an Indian payment flow and the only evidence we have in a dispute *(T75)*

---

## 4. Rules for whoever edits this next

**Prices are never literals.** `CANONICAL-VALUES.md` §1 is the authority.

**`+ 18% GST` must never break across lines.** Below the width where it fits, drop "18%" and show `₹1,999 + GST` over `₹2,359 payable` — never orphan "GST" next to the payable figure.

**Customer-facing names are the Audit, the Report, the Roadmap.** Never "Tier 1/2/3".

**The entity line appears before payment, not only on the receipt.** A founder should know who is taking the money before they tap, not after. *(Decision P9.)*

**It is also doing a second job.** Razorpay's checkout shows **Corporate Culture** as the merchant, but settlement is to **Blue Bird Ventures** — which is what may appear on the founder's card or UPI statement. A customer who sees an unfamiliar name on their statement raises a dispute; `T2C-ENTITY` on the screen before payment is what stops that. **Confirmed 12 October: the statement descriptor is Blue Bird Ventures.** No extra copy is needed — `T2C-ENTITY` already names it before payment. **This line is therefore load-bearing, not decoration: do not let it be dropped for layout reasons on a narrow screen.** The same line must also appear on the receipt email, which is where a founder looks when the statement arrives days later.
