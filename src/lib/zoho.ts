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
  };
};

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

/** Field api_names confirmed via GET /crm/v8/settings/fields?module=FRA_Submissions. */
function toRecord(submission: FraSubmission) {
  const brandName = submission.brandName.trim();

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
