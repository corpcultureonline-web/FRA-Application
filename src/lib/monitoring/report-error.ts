import * as Sentry from "@sentry/nextjs";

/**
 * For errors the app catches and handles — a 500 returned, a CRM push that
 * failed — which Next.js never sees as unhandled. Logs locally and sends the
 * error to Sentry. Tag with join keys only (submission_id, session_id), never
 * a person; the event is scrubbed again before it is sent.
 */
export function reportError(
  message: string,
  error: unknown,
  tags: { submission_id?: number | string; session_id?: string } = {},
) {
  console.error(message, error);
  Sentry.captureException(error, {
    tags: Object.fromEntries(Object.entries(tags).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    extra: { context: message },
  });
}
