/**
 * Sentry settings shared by the server and the browser (Response to the Tech
 * Stack Audit §1.3). Errors only: no performance tracing, no session replay,
 * no profiling. Off entirely until NEXT_PUBLIC_SENTRY_DSN is set.
 */
import { scrubEvent } from "./scrub";

type Env = Record<string, string | undefined>;

export function sentryOptions(secretsEnv: Env) {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
    enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    // "production" or "staging" on a server; anything else is local noise.
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
      (process.env.NODE_ENV === "production" ? "production" : "development"),
    // The deploy's commit SHA, inlined at build time by next.config.ts.
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    // Never a name, email, mobile, brand, questionnaire body, token or key.
    beforeSend: <T>(event: T) => scrubEvent(event, secretsEnv),
    beforeBreadcrumb: <T>(breadcrumb: T) => scrubEvent(breadcrumb, secretsEnv),
  };
}
