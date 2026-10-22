import "server-only";
import { t2 } from "@/lib/tier2/strings";
import { compose } from "./compose";
import type { Email } from "./email";

/**
 * The emails the review panel sends (Messages v1.2 §5, §7, §8), built from
 * their library keys and nothing else.
 */

/** §8: the review-panel sign-in link. */
export function signInEmail(to: string, url: string): Email {
  return compose({
    to,
    subject: t2("T2M-SIGNIN-SUBJ"),
    lines: [t2("T2M-SIGNIN-HEAD")],
    button: { label: t2("T2M-SIGNIN-BTN"), url },
    after: [t2("T2M-SIGNIN-EXPIRY"), t2("T2M-SIGNIN-IGNORE")],
  });
}

/** §5: the Report is ready. The link is the tracked one (T77). WhatsApp follows once the template is approved. */
export function reportReadyEmail(to: string, url: string): Email {
  return compose({
    to,
    subject: t2("T2M-READY-SUBJ"),
    lines: [t2("T2M-READY-HEAD"), t2("T2M-READY-BODY")],
    button: { label: t2("T2M-READY-BTN"), url },
    after: [t2("T2M-READY-PRIVATE"), t2("T2M-READY-HELP")],
  });
}

/** §7: the refund has been processed. `amount` is the rupee figure as charged, "₹2,359". */
export function refundEmail(to: string, amount: string): Email {
  return compose({
    to,
    subject: t2("T2M-REFUND-SUBJ"),
    lines: [
      t2("T2M-REFUND-HEAD"),
      t2("T2M-REFUND-BODY").replace("{amount}", amount),
      t2("T2M-REFUND-ENTITY"),
      t2("T2M-REFUND-NOTHING"),
    ],
    after: [t2("T2M-REFUND-HELP")],
  });
}
