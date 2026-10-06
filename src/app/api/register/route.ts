import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { createFraSubmission, getZohoWebhookUrl, isZohoConfigured } from "@/lib/zoho";

type Registration = {
  brandName?: unknown;
  founderName?: unknown;
  email?: unknown;
  phone?: unknown;
};

type ValidRegistration = Record<keyof Registration, string>;

function isValidRegistration(data: Registration): data is ValidRegistration {
  return (
    typeof data.brandName === "string" &&
    typeof data.founderName === "string" &&
    typeof data.email === "string" &&
    typeof data.phone === "string" &&
    data.brandName.trim().length > 0 &&
    data.founderName.trim().length > 0 &&
    /^\S+@\S+\.\S+$/.test(data.email.trim()) &&
    /^[\d\s()+-]{7,}$/.test(data.phone.trim())
  );
}

export async function POST(request: Request) {
  let data: Registration;

  try {
    data = (await request.json()) as Registration;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidRegistration(data)) {
    return NextResponse.json(
      { error: "Please provide a valid brand name, founder name, email, and phone." },
      { status: 400 },
    );
  }

  try {
    await getDatabase().execute(
      "INSERT INTO registrations (brand_name, founder_name, email, phone) VALUES (?, ?, ?, ?)",
      [data.brandName.trim(), data.founderName.trim(), data.email.trim(), data.phone.trim()],
    );
  } catch (error) {
    console.error("Registration insert failed", error);
    return NextResponse.json(
      { error: "Registration could not be saved. Please try again later." },
      { status: 500 },
    );
  }

  const submission = {
    brandName: data.brandName.trim(),
    founderName: data.founderName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
  };

  // CRM delivery is best effort: the registration is already saved, so a Zoho
  // outage must not lose the signup or fail the request.
  if (isZohoConfigured()) {
    try {
      const { duplicate, id } = await createFraSubmission(submission);
      console.info(
        duplicate
          ? `Zoho FRA submission already exists (${id})`
          : `Zoho FRA submission created (${id})`,
      );
    } catch (error) {
      console.error("Zoho FRA submission creation failed", error);
    }
  } else {
    console.warn("Zoho CRM credentials are not configured, skipping CRM submission.");
  }

  const zohoWebhookUrl = getZohoWebhookUrl();
  if (zohoWebhookUrl) {
    try {
      const webhookResponse = await fetch(zohoWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      if (!webhookResponse.ok) {
        console.error("Zoho webhook failed", webhookResponse.status);
      }
    } catch (error) {
      console.error("Zoho webhook request failed", error);
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}