import { NextResponse, after } from "next/server";
import { requestIp } from "@/lib/events/server";
import { parseContact } from "@/lib/find-result/contact";
import { admitRequest, sendRecovery } from "@/lib/find-result/recovery";
import { reportError } from "@/lib/monitoring/report-error";

/**
 * "Send me the link" on /find-my-result (handoff v3.1 §6). Answers "sent" or
 * "wait" and nothing else: never the link, and never whether the contact is
 * known. The lookup and the send run after the response.
 */
export async function POST(request: Request) {
  let body: { contact?: unknown };
  try {
    body = (await request.json()) as { contact?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const contact = typeof body.contact === "string" ? parseContact(body.contact) : null;
  if (!contact) return NextResponse.json({ error: "format" }, { status: 400 });

  try {
    if (!(await admitRequest(contact, requestIp(request.headers)))) {
      return NextResponse.json({ status: "wait" });
    }
  } catch (error) {
    reportError("find-my-result rate limit failed", error);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }

  after(async () => {
    try {
      await sendRecovery(contact);
    } catch (error) {
      reportError("find-my-result send failed", error);
    }
  });
  return NextResponse.json({ status: "sent" });
}
