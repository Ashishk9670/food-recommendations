import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
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
  silent: true,
  // No SENTRY_AUTH_TOKEN/org/project is configured, so source-map upload is
  // skipped — stack traces in Sentry will show minified code until that's added.
  sourcemaps: {
    disable: true,
  },
});
