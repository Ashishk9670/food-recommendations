import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code worktrees live inside the repo folder and carry their own
    // .next build output, which would otherwise flood `npm run lint`.
    ".claude/**",
    // Playwright HTML reports and traces (generated, minified).
    "playwright-report*/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
