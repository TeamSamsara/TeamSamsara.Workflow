// File : /TeamSamsara.Workflow/app/vitest.config.ts
// Version : 1.2.1
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Unit tests: the same @/ alias as the app, a browser-like page (jsdom)
// for code that touches the DOM, and tests found next to the files they test
// (the engine's too).
// Placeholder Firebase settings let modules that import lib/firebase load without
// an .env file (as in CI); no test talks to Firebase.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: { fs: { allow: [path.resolve(__dirname, "..")] } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The rules the app shares with the server functions.
      "@engine": path.resolve(__dirname, "../engine/src"),
    },
  },
  test: {
    environment: "jsdom",
    // The engine has no packages of its own, so its tests use describe, it
    // and expect without importing them.
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "../engine/src/**/*.test.ts"],
    env: {
      VITE_FIREBASE_API_KEY: "test-api-key",
      VITE_FIREBASE_AUTH_DOMAIN: "demo-workflow-test.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "demo-workflow-test",
      VITE_FIREBASE_APP_ID: "test-app-id",
    },
  },
});
