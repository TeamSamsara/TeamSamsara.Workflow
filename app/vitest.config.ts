// File : /TeamSamsara.Workflow/app/vitest.config.ts
// Version : 1.1.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Unit tests: the same @/ alias as the app, a browser-like page (jsdom)
// for code that touches the DOM, and tests found next to the files they test.
// Placeholder Firebase settings let modules that import lib/firebase load without
// an .env file (as in CI); no test talks to Firebase.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      VITE_FIREBASE_API_KEY: "test-api-key",
      VITE_FIREBASE_AUTH_DOMAIN: "demo-workflow-test.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "demo-workflow-test",
      VITE_FIREBASE_APP_ID: "test-app-id",
    },
  },
});
