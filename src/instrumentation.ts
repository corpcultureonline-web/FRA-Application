import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/monitoring/sentry-options";

/** Server-side error capture: route handlers, server components, server actions. */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(sentryOptions(process.env));
  }
}

/** Errors Next.js catches itself while rendering or handling a request. */
export const onRequestError = Sentry.captureRequestError;
