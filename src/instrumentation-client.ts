import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/monitoring/sentry-options";

// Browser-side capture of unhandled errors and promise rejections. The browser
// holds no server secrets, so there are none to scrub beyond personal data.
Sentry.init(sentryOptions({}));
