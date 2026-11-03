"use client";

import Image from "next/image";
import Script from "next/script";
import { useState, type FormEvent } from "react";
import logo from "@/assets/logo.png";
import mastercard from "@/assets/tier2/mastercard.png";
import razorpay from "@/assets/tier2/razorpay.png";
import rupay from "@/assets/tier2/rupay.png";
import upi from "@/assets/tier2/upi.png";
import visa from "@/assets/tier2/visa.png";
import { withBasePath } from "@/lib/base-path";
import { CONTACT_EMAIL } from "@/lib/company";
import type { Segment } from "@/lib/tier2/library";
import styles from "./checkout.module.css";

export type CheckoutCopy = {
  head: string;
  item: string;
  priceHead: Segment[];
  pricePay: string;
  payButton: string;
  mobileLabel: string;
  mobileWhy: string;
  mobileError: string;
  refundLine: string;
  refundLink: string;
  consent: { text: string; href: string | null }[];
  consentError: string;
  secure: string;
  methods: string;
  invoice: string;
  entity: string;
  next: string;
  fail: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: Record<string, string>;
  theme: { color: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
};
type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: { error?: { code?: string; reason?: string } }) => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const MOBILE = /^[6-9]\d{9}$/;

/** The policy footer, as on the boards. Labels are the documents' titles. */
const POLICIES = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refunds", label: "Refund Policy" },
];

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.msgIcon}>
      <circle cx="8" cy="8" r="6.5" stroke="#B8360F" strokeWidth="1.5" />
      <path d="M8 4.6v4.2" stroke="#B8360F" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r=".9" fill="#B8360F" />
    </svg>
  );
}

/**
 * Pay stays enabled whatever is filled in (T75): a tap with a missing number or
 * an unticked box shows the reason against the field instead. Nothing about the
 * amount comes from here — the server sets it from the pricing config.
 */
export function CheckoutForm({
  auditToken,
  initialMobile,
  copy,
}: {
  auditToken: string;
  initialMobile: string;
  copy: CheckoutCopy;
}) {
  const [mobile, setMobile] = useState(initialMobile);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({ mobile: false, consent: false });
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reportFailure(orderId: string, reason: string) {
    setFailed(true);
    setBusy(false);
    await fetch(withBasePath("/api/orders/failed"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razorpay_order_id: orderId, reason }),
      keepalive: true,
    }).catch(() => {});
  }

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const digits = mobile.replace(/\D/g, "");
    const next = { mobile: !MOBILE.test(digits), consent: !consent };
    setErrors(next);
    if (next.mobile || next.consent) return;

    setBusy(true);
    setFailed(false);
    let order: Partial<RazorpayOptions> & { paid?: string; error?: string; key?: string; orderId?: string };
    try {
      const response = await fetch(withBasePath("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit: auditToken, mobile: digits, consent }),
      });
      order = await response.json();
      if (!response.ok && order.error === "invalid") {
        setErrors({ mobile: Boolean((order as { mobile?: boolean }).mobile), consent: Boolean((order as { consent?: boolean }).consent) });
        setBusy(false);
        return;
      }
      if (order.paid) {
        window.location.assign(order.paid);
        return;
      }
      if (!response.ok || !order.orderId || !order.key || !window.Razorpay) throw new Error("order");
    } catch {
      setFailed(true);
      setBusy(false);
      return;
    }

    const orderId = order.orderId;
    const checkout = new window.Razorpay({
      key: order.key,
      order_id: orderId,
      amount: order.amount!,
      currency: order.currency!,
      name: order.name!,
      description: order.description!,
      prefill: order.prefill!,
      theme: { color: "#F78F1E" },
      handler: async (result) => {
        try {
          const response = await fetch(withBasePath("/api/orders/confirm"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
          });
          const confirmed = (await response.json()) as { next?: string };
          if (!response.ok || !confirmed.next) throw new Error("confirm");
          window.location.assign(confirmed.next);
        } catch {
          // Paid but not confirmed here: the webhook records it, and the
          // founder's link arrives by email. Never show "nothing was charged".
          setBusy(false);
        }
      },
      modal: { ondismiss: () => void reportFailure(orderId, "cancelled") },
    });
    checkout.on("payment.failed", (response) => {
      void reportFailure(orderId, response.error?.code ?? "failed");
    });
    checkout.open();
  }

  return (
    <div className={styles.page}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <header className={styles.top}>
        <Image src={logo} alt="Corporate Culture" unoptimized priority className={styles.logo} />
      </header>
      <main className={styles.main}>
        <form className={styles.card} onSubmit={pay} noValidate>
          {failed && (
            <p className={styles.fail} role="status">
              {copy.fail}
            </p>
          )}
          <h1>{copy.head}</h1>

          <div className={styles.summary}>
            <p className={styles.item}>{copy.item}</p>
            <div className={styles.price}>
              <p className={styles.priceHead}>
                {copy.priceHead.map((segment, i) =>
                  segment.strong ? (
                    <span key={i} className={styles.amount}>
                      {segment.text.trim()}
                    </span>
                  ) : (
                    <span key={i} className={styles.gst}>
                      {segment.text.trim()}
                    </span>
                  ),
                )}
              </p>
              <p className={styles.payable}>{copy.pricePay}</p>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="mobile">{copy.mobileLabel}</label>
            <div className={`${styles.tel} ${errors.mobile ? styles.telError : ""}`}>
              <span className={styles.cc} aria-hidden="true">
                +91
              </span>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={11}
                placeholder="98765 43210"
                value={mobile}
                onChange={(event) => {
                  setMobile(event.target.value.replace(/[^\d ]/g, ""));
                  if (errors.mobile) setErrors((current) => ({ ...current, mobile: false }));
                }}
                aria-invalid={errors.mobile}
                aria-describedby={errors.mobile ? "mobile-error mobile-why" : "mobile-why"}
              />
            </div>
            {errors.mobile && (
              <p className={styles.msg} id="mobile-error">
                <ErrorIcon />
                <span>{copy.mobileError}</span>
              </p>
            )}
            <p className={styles.why} id="mobile-why">
              {copy.mobileWhy}
            </p>
          </div>

          <div className={styles.payGroup}>
            <p className={styles.refund}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M9 1.8l6 2.4v4.3c0 3.7-2.5 6.6-6 7.7-3.5-1.1-6-4-6-7.7V4.2z"
                  stroke="#231F20"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.2 9.2l1.9 1.9 3.8-3.9"
                  stroke="#231F20"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                {copy.refundLine}{" "}
                <a href={withBasePath("/refunds")} target="_blank" rel="noopener">
                  {copy.refundLink}
                </a>
              </span>
            </p>

            <div className={styles.consent}>
              <label>
                <input
                  type="checkbox"
                  name="consent"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    if (event.target.checked) setErrors((current) => ({ ...current, consent: false }));
                  }}
                  aria-invalid={errors.consent}
                  aria-describedby={errors.consent ? "consent-error" : undefined}
                />
                <span
                  className={`${styles.box} ${consent ? styles.boxOn : ""} ${errors.consent ? styles.boxBad : ""}`}
                  aria-hidden="true"
                >
                  {consent && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.3l2.9 2.9 6.1-6.4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span>
                  {copy.consent.map((part, i) =>
                    part.href ? (
                      <a key={i} href={withBasePath(part.href)} target="_blank" rel="noopener">
                        {part.text}
                      </a>
                    ) : (
                      <span key={i}>{part.text}</span>
                    ),
                  )}
                </span>
              </label>
              {errors.consent && (
                <p className={styles.consentMsg} id="consent-error">
                  <ErrorIcon />
                  <span>{copy.consentError}</span>
                </p>
              )}
            </div>

            <button type="submit" className={styles.payButton} aria-busy={busy}>
              <span>{copy.payButton}</span>
              <svg width="16" height="11" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className={styles.trust}>
            <Image src={razorpay} alt="" unoptimized className={styles.razorpay} />
            <p className={styles.trustLine}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2.5" y="7" width="11" height="7.5" rx="1.5" stroke="#231F20" strokeWidth="1.5" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#231F20" strokeWidth="1.5" />
              </svg>
              {copy.secure}
            </p>
            <ul aria-label="Payment methods">
              <li>
                <Image src={upi} alt="UPI" unoptimized style={{ height: 18, width: "auto" }} />
              </li>
              <li>
                <Image src={rupay} alt="RuPay" unoptimized style={{ height: 16, width: "auto" }} />
              </li>
              <li>
                <Image src={visa} alt="Visa" unoptimized style={{ height: 15, width: "auto" }} />
              </li>
              <li>
                <Image src={mastercard} alt="Mastercard" unoptimized style={{ height: 22, width: "auto" }} />
              </li>
            </ul>
            <p className={styles.methods}>{copy.methods}</p>
            <p className={styles.trustLine}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.5 1.5h6l3 3v10h-9z" stroke="#231F20" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M6 8h4M6 11h4" stroke="#231F20" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {copy.invoice}
            </p>
          </div>

          <p className={styles.entity}>{copy.entity}</p>
          <nav className={styles.legal} aria-label="Policies">
            {POLICIES.map((policy) => (
              <a key={policy.href} href={withBasePath(policy.href)} target="_blank" rel="noopener">
                {policy.label}
              </a>
            ))}
            <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          </nav>

          <p className={styles.next}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="7" stroke="#231F20" strokeWidth="1.5" />
              <path d="M9 5v4.2l2.8 1.8" stroke="#231F20" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>{copy.next}</span>
          </p>
        </form>
      </main>
    </div>
  );
}
