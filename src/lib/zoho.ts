import type { PublicScore } from "./scoring/public.ts";

const ACCOUNTS_DOMAIN_BY_API_HOST: Record<string, string> = {
  "www.zohoapis.com": "https://accounts.zoho.com",
  "www.zohoapis.eu": "https://accounts.zoho.eu",
  "www.zohoapis.in": "https://accounts.zoho.in",
  "www.zohoapis.com.au": "https://accounts.zoho.com.au",
  "www.zohoapis.jp": "https://accounts.zoho.jp",
  "www.zohoapis.ca": "https://accounts.zohocloud.ca",
  "www.zohoapis.sa": "https://accounts.zoho.sa",
  "www.zohoapis.com.cn": "https://accounts.zoho.com.cn",
};

/** Custom module api_name, confirmed via GET /crm/v8/settings/modules. */
const MODULE = "FRA_Submissions";

export type FraSubmission = {
  brandName: string;
  founderName: string;
  email: string;
  /** Not collected by the free audit. */
  phone?: string;
  /**
   * Tier 1 result, for the follow-up email. Display values only — the exact
   * overall score must never be sent to Zoho (spec §4, decision D2).
   */
  result?: {
    /** e.g. "56 – 73" */
    scoreRange: string;
    /** Level after the legal gate, e.g. "Almost Ready". */
    readinessLevel: string;
    /** Display name, e.g. "Market Proof". */
    weakestArea: string | null;
    /** Public link to the results PDF (/api/report/<token>). */
    reportUrl?: string;
  };
};

/**
 * The Tier 1 result fields sent to Zoho — built from the public score only, so
 * the overall score cannot reach the CRM or the follow-up email.
 */
export function fraResult(score: PublicScore, reportUrl?: string): NonNullable<FraSubmission["result"]> {
  return {
    scoreRange: `${score.range.low} – ${score.range.high}`,
    readinessLevel: score.band.name,
    weakestArea: score.areas.find((a) => a.code === score.weakest)?.name ?? null,
    reportUrl,
  };
}

type ZohoRecordResult = {
  code?: string;
  status?: string;
  message?: string;
  details?: { id?: string };
};

let cachedToken: { value: string; expiresAt: number } | undefined;

function getRegionDomain() {
  return (process.env.ZOHO_REGION_DOMAIN ?? "https://www.zohoapis.in").replace(/\/+$/, "");
}

function getAccountsDomain() {
  const configured = process.env.ZOHO_ACCOUNTS_DOMAIN;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const host = new URL(getRegionDomain()).host;
  return ACCOUNTS_DOMAIN_BY_API_HOST[host] ?? "https://accounts.zoho.in";
}

export function isZohoConfigured() {
  return Boolean(
    process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET &&
      process.env.ZOHO_REFRESH_TOKEN,
  );
}

async function getAccessToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ZOHO_CLIENT_ID ?? "",
    client_secret: process.env.ZOHO_CLIENT_SECRET ?? "",
    refresh_token: process.env.ZOHO_REFRESH_TOKEN ?? "",
  });

  const response = await fetch(`${getAccountsDomain()}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(`Zoho token refresh failed: ${payload.error ?? response.status}`);
  }

  // Refresh a minute early so a token never expires mid-request.
  const expiresInSeconds = payload.expires_in ?? 3600;
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000,
  };

  return cachedToken.value;
}

/**
 * API name of the URL field that holds the results PDF link, e.g. Report_URL.
 * Unset until the field exists in the module, so record creation never fails
 * on an unknown field.
 */
function getReportUrlField() {
  return process.env.ZOHO_REPORT_URL_FIELD?.trim() || undefined;
}

/** Field api_names confirmed via GET /crm/v8/settings/fields?module=FRA_Submissions. */
export function toRecord(submission: FraSubmission) {
  const brandName = submission.brandName.trim();
  const reportUrlField = getReportUrlField();

  return {
    // "FRA Submission Tier 1 Name" is the module's mandatory record-name field.
    Name: brandName,
    Brand_Name: brandName,
    Founder_Name: submission.founderName.trim(),
    Email_ID: submission.email.trim(),
    ...(submission.phone?.trim() ? { Phone: submission.phone.trim() } : {}),
    // Score_Range, Readiness_Level and Weakest_Area were added for the Tier 1 audit.
    ...(submission.result
      ? {
          Score_Range: submission.result.scoreRange,
          Readiness_Level: submission.result.readinessLevel,
          ...(submission.result.weakestArea ? { Weakest_Area: submission.result.weakestArea } : {}),
          ...(reportUrlField && submission.result.reportUrl
            ? { [reportUrlField]: submission.result.reportUrl }
            : {}),
        }
      : {}),
  };
}

async function postRecord(submission: FraSubmission, accessToken: string) {
  return fetch(`${getRegionDomain()}/crm/v8/${MODULE}`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: [toRecord(submission)], trigger: ["workflow"] }),
    cache: "no-store",
  });
}

/**
 * Creates the record in the FRA Submissions module. Throws on failure so the
 * caller decides whether a CRM outage should fail the registration.
 */
export async function createFraSubmission(submission: FraSubmission) {
  if (!isZohoConfigured()) {
    throw new Error("Zoho CRM credentials are not configured.");
  }

  let accessToken = await getAccessToken();
  let response = await postRecord(submission, accessToken);

  if (response.status === 401) {
    // Cached token was revoked or stale — refresh once and retry.
    accessToken = await getAccessToken(true);
    response = await postRecord(submission, accessToken);
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: ZohoRecordResult[];
  } | null;
  const result = payload?.data?.[0];

  if (result?.code === "DUPLICATE_DATA") {
    return { duplicate: true, id: result.details?.id };
  }

  if (!response.ok || result?.status !== "success") {
    throw new Error(
      `Zoho ${MODULE} create failed (${response.status}): ${result?.code ?? result?.message ?? "unknown error"}`,
    );
  }

  return { duplicate: false, id: result.details?.id };
}

/**
 * API name of the Date/Time field "Tier 2 Interest At" on FRA Submissions
 * (Content Library §20). Unset until the field exists, so nothing is pushed —
 * the interest is still saved in MySQL.
 */
export function getTier2InterestField() {
  return process.env.ZOHO_TIER2_FIELD?.trim() || undefined;
}

/** Zoho Date/Time format, in IST: 2026-10-08T14:05:00+05:30. */
export function zohoDateTime(date: Date) {
  const ist = new Date(date.getTime() + 330 * 60_000);
  return `${ist.toISOString().slice(0, 19)}+05:30`;
}

/** A Zoho CRM call with the cached token, refreshed once on a 401. */
async function zohoFetch(path: string, init: RequestInit = {}) {
  const send = async (token: string) =>
    fetch(`${getRegionDomain()}/crm/v8/${path}`, {
      ...init,
      headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
  let response = await send(await getAccessToken());
  if (response.status === 401) response = await send(await getAccessToken(true));
  return response;
}

/**
 * The most recent FRA Submissions record for an email — for submissions saved
 * before the record id was kept in MySQL. Undefined when there is none.
 */
export async function findFraSubmissionId(email: string) {
  const criteria = encodeURIComponent(`(Email_ID:equals:${email.replace(/([(),\\])/g, "\\$1")})`);
  const response = await zohoFetch(`${MODULE}/search?criteria=${criteria}&sort_by=Created_Time&sort_order=desc&per_page=1`);
  if (response.status === 204) return undefined;
  const payload = (await response.json().catch(() => null)) as { data?: { id?: string }[] } | null;
  if (!response.ok) throw new Error(`Zoho ${MODULE} search failed (${response.status})`);
  return payload?.data?.[0]?.id;
}

/** Updates fields on an FRA Submissions record and runs its workflows (the notification). */
export async function updateFraSubmission(id: string, fields: Record<string, string>) {
  const response = await zohoFetch(`${MODULE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ data: [fields], trigger: ["workflow"] }),
  });
  const payload = (await response.json().catch(() => null)) as { data?: ZohoRecordResult[] } | null;
  const result = payload?.data?.[0];
  if (!response.ok || result?.status !== "success") {
    throw new Error(
      `Zoho ${MODULE} update failed (${response.status}): ${result?.code ?? result?.message ?? "unknown error"}`,
    );
  }
}

/**
 * Optional secondary delivery (Zoho Flow / CRM webhook). Ignores an unset or
 * placeholder value so a half-filled .env never breaks a registration.
 */
export function getZohoWebhookUrl() {
  const raw = process.env.ZOHO_WEBHOOK_URL?.trim();
  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    console.warn(`ZOHO_WEBHOOK_URL is not a valid URL, skipping webhook: ${raw}`);
    return undefined;
  }
}
