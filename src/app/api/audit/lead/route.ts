import { NextResponse } from "next/server";
import { readProfile } from "@/lib/audit";
import { saveLead } from "@/lib/audit-leads";
import { onSection1 } from "@/lib/events/lifecycle";
import { eventContext } from "@/lib/events/server";
import { reportError } from "@/lib/monitoring/report-error";

/**
 * Section 1 of the Audit, posted when the founder continues past it (handoff
 * v3.1 §5.1): name, email and WhatsApp number are kept from this point, so a
 * founder who stops before the result is still reachable. Fire and forget on
 * the client — a failure here never stops the Audit.
 */
export async function POST(request: Request) {
  let body: { profile?: unknown };
  try {
    body = (await request.json()) as { profile?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const profile = readProfile(body.profile);
  if (!profile) return NextResponse.json({ error: "Section 1 is incomplete." }, { status: 400 });

  const context = eventContext(request.headers);
  try {
    await saveLead(context.sessionId, profile);
  } catch (error) {
    reportError("Saving the Audit lead failed", error);
    return NextResponse.json({ error: "Not saved." }, { status: 500 });
  }
  // The visitor becomes a User, and this browser's earlier events are stitched to them (Identity handoff §6.2).
  await onSection1(context, { phone: profile.phone, email: profile.email });
  return NextResponse.json({ success: true });
}
