// File : /TeamSamsara.Workflow/tests/rules/rulesTestEnv.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Shared setup for the security-rule tests: starts a test environment
// with the real firestore.rules, gives a Firestore client signed in as anyone (or
// no one), and writes seed data with the rules switched off.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import type { DocumentData } from "firebase/firestore";

const here = path.dirname(fileURLToPath(import.meta.url));
const rulesPath = path.resolve(here, "../../firestore.rules");

/** A demo- project id never touches a real Firebase project. */
export const rulesTestProjectId = "demo-workflow-rules";

export function startRulesTestEnv(): Promise<RulesTestEnvironment> {
  // The emulator's address comes from FIRESTORE_EMULATOR_HOST, set by `firebase emulators:exec`.
  return initializeTestEnvironment({
    projectId: rulesTestProjectId,
    firestore: { rules: readFileSync(rulesPath, "utf8") },
  });
}

/** A Firestore client signed in as this user id. */
export function signedInAs(env: RulesTestEnvironment, userId: string) {
  return env.authenticatedContext(userId).firestore();
}

/** A Firestore client with nobody signed in. */
export function signedOut(env: RulesTestEnvironment) {
  return env.unauthenticatedContext().firestore();
}

/** Writes documents as if the rules did not exist, to set up a test. */
export async function seed(
  env: RulesTestEnvironment,
  documents: Record<string, DocumentData>,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all(
      Object.entries(documents).map(([docPath, data]) =>
        db.doc(docPath).set(data),
      ),
    );
  });
}
