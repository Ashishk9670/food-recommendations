import * as Sentry from "@sentry/nextjs";

// Errors only: performance tracing is compiled out of the browser bundle
// (bundleSizeOptimizations in next.config.ts) to keep first-load JS small.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
