// File : /TeamSamsara.Workflow/tests/rules/vitest.config.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Runs the security-rule tests against the Firestore emulator. One file
// at a time, because every test clears the same emulator database.

import { defineConfig } from "vitest/config";

const emulatorTestTimeoutMs = 20_000;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.rules.test.ts"],
    fileParallelism: false,
    testTimeout: emulatorTestTimeoutMs,
    hookTimeout: emulatorTestTimeoutMs,
  },
});
