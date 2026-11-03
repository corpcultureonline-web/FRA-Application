import { NextResponse } from "next/server";
import { reportError } from "@/lib/monitoring/report-error";
import { changeDelivery } from "@/lib/payments/delivery";
import { paidRun } from "@/lib/payments/orders";

/**
 * Screen 5's Change: corrects the email or the WhatsApp number the Report will
 * go to (Submitted v1.2 §3). Answers with the stored value, or "invalid" so the
 * screen shows the library's error, or "sent" once the Report has gone.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/runs/[token]/delivery">) {
  const { token } = await ctx.params;
  let body: { email?: unknown; mobile?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const change =
    typeof body.email === "string" ? { email: body.email } : typeof body.mobile === "string" ? { mobile: body.mobile } : null;
  if (!change) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const run = await paidRun(token);
    if (!run) return NextResponse.json({ error: "run" }, { status: 404 });
    const stored = await changeDelivery(run.orderId, change);
    if (stored === null) return NextResponse.json({ error: "invalid" }, { status: 400 });
    if (stored === "sent") return NextResponse.json({ error: "sent" }, { status: 409 });
    return NextResponse.json({ value: stored });
  } catch (error) {
    reportError("Delivery change failed", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
