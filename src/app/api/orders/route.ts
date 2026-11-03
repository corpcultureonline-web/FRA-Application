import { NextResponse } from "next/server";
import { legalVersions } from "@/lib/legal/documents";
import { reportError } from "@/lib/monitoring/report-error";
import { auditForCheckout, createOrder, paidOrderToken } from "@/lib/payments/orders";
import { razorpayKeys } from "@/lib/payments/razorpay";
import { personalLinkPath } from "@/lib/payments/record";
import { normaliseMobile } from "@/lib/payments/signatures";
import { TIERS } from "@/lib/pricing";
import { withBasePath } from "@/lib/base-path";

/**
 * Pay on the checkout screen (Screen 2): creates our order and the Razorpay
 * order it is paid against, and returns what Razorpay Checkout needs to open.
 *
 * Errors come back as codes, never sentences: the screen shows the library's
 * own words for each (T2C-MOBILE-ERR, T2C-CONSENT-ERR, T2C-FAIL).
 */
export async function POST(request: Request) {
  let body: { audit?: unknown; mobile?: unknown; consent?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const mobile = typeof body.mobile === "string" ? normaliseMobile(body.mobile) : null;
  const consent = body.consent === true;
  if (!mobile || !consent) {
    return NextResponse.json({ error: "invalid", mobile: !mobile, consent: !consent }, { status: 400 });
  }

  try {
    const audit = typeof body.audit === "string" ? await auditForCheckout(body.audit) : null;
    if (!audit) return NextResponse.json({ error: "audit" }, { status: 404 });

    // Already bought from this Audit: send them to it rather than charge again.
    const existing = await paidOrderToken(audit.id);
    if (existing) return NextResponse.json({ paid: withBasePath(personalLinkPath(existing)) });

    const order = await createOrder({ auditId: audit.id, mobile, consentVersions: legalVersions() });
    return NextResponse.json({
      key: razorpayKeys().keyId,
      orderId: order.razorpayOrderId,
      amount: order.amountPaise,
      currency: "INR",
      // Razorpay's checkout display name is the brand (CANONICAL-VALUES §2);
      // the description is the product's name (§1b), never a tier number.
      name: "Corporate Culture",
      description: TIERS.report.name,
      prefill: { name: audit.founderName, email: audit.email, contact: mobile },
    });
  } catch (error) {
    reportError("Report order creation failed", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
