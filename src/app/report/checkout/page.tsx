import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auditForCheckout, paidOrderToken } from "@/lib/payments/orders";
import { personalLinkPath } from "@/lib/payments/record";
import { plain, segments } from "@/lib/tier2/library";
import { t2 } from "@/lib/tier2/strings";
import { CheckoutForm, type CheckoutCopy } from "./CheckoutForm";

export const metadata: Metadata = { title: plain(t2("T2C-HEAD")) };

/** The policy each link in T2C-CONSENT opens, matched on its label. */
const CONSENT_LINKS: [RegExp, string][] = [
  [/terms/i, "/terms"],
  [/privacy/i, "/privacy"],
  [/refund/i, "/refunds"],
];

function copy(): CheckoutCopy {
  return {
    head: plain(t2("T2C-HEAD")),
    item: plain(t2("T2C-ITEM")),
    // The price strings are the library's; a test holds them equal to the
    // pricing config, which is what Razorpay is actually asked to charge.
    priceHead: segments(t2("T2C-PRICE-HEAD")),
    pricePay: plain(t2("T2C-PRICE-PAY")),
    payButton: plain(t2("T2C-PAY-BTN")),
    mobileLabel: plain(t2("T2C-MOBILE-LABEL")),
    mobileWhy: plain(t2("T2C-MOBILE-WHY")),
    mobileError: plain(t2("T2C-MOBILE-ERR")),
    // Client review, 23 Oct 2026: the library's "Full refund if you change your
    // mind." promised more than the Refund Policy, which refunds in full only
    // before the answers are submitted. The client's wording, until
    // T2C-REFUND-LINE is updated in the Checkout library.
    refundLine: "Full refund any time before you submit your answers.",
    refundLink: plain(t2("T2L-PAY-REFUND")),
    consent: segments(t2("T2C-CONSENT")).map((segment) => ({
      text: segment.text,
      href: segment.strong ? (CONSENT_LINKS.find(([label]) => label.test(segment.text))?.[1] ?? null) : null,
    })),
    consentError: plain(t2("T2C-CONSENT-ERR")),
    secure: plain(t2("T2L-PAY-SECURE")),
    methods: plain(t2("T2L-PAY-METHODS")),
    invoice: plain(t2("T2L-PAY-INVOICE")),
    entity: plain(t2("T2C-ENTITY")),
    next: plain(t2("T2C-NEXT")),
    fail: plain(t2("T2C-FAIL")),
  };
}

/**
 * Screen 2, checkout (Checkout library v1.1, boards 2-*). Reached from a
 * completed Audit's result (?audit=<result token>): the Report needs one
 * (P11), so without it the visitor goes to the free Audit first.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auditToken = typeof params.audit === "string" ? params.audit : "";
  const audit = auditToken ? await auditForCheckout(auditToken) : null;
  if (!audit) redirect("/");

  const paid = await paidOrderToken(audit.id);
  if (paid) redirect(personalLinkPath(paid));

  return (
    <CheckoutForm
      auditToken={auditToken}
      initialMobile={audit.phone?.replace(/\D/g, "").slice(-10) ?? ""}
      copy={copy()}
    />
  );
}
