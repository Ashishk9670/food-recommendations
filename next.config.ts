import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Sentry is used for error reporting only. Compiling its tracing and debug
// code paths out shrinks the JavaScript every visitor downloads first.
// (withSentryConfig's `bundleSizeOptimizations` does the same for webpack
// builds only; this project builds with Turbopack.) Next JSON-stringifies
// define values, so these must be real booleans, not the string "false".
const sentryCompileTimeFlags = {
  __SENTRY_DEBUG__: false,
  __SENTRY_TRACING__: false,
} as unknown as Record<string, string>;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  compiler: {
    define: sentryCompileTimeFlags,
  },
  images: {
    // Dish photos never change once uploaded (unique filenames; edits don't
    // replace photos, deletes remove the file), so resized copies can be
    // cached for a month instead of the 4-hour default — faster repeat
    // visits and fewer paid re-optimizations.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lakzdswikysavelzdoeh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lpnnisusypuadcqyuddh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
