// File : /TeamSamsara.Workflow/tests/rules/maintenance.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests the check-up's switch and reports against the rules:
// Administrators turn Apply on or off and read the reports; nobody else does,
// and only the server writes reports.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": {
      roles: { admin: { name: "Admin", position: 1, permissions: ["administrator"] } },
      grants: { administrator: ["admin"] },
    },
    "members/alex": { status: "active", roleIds: ["admin"] },
    "members/sam": { status: "active", roleIds: [] },
    "maintenanceRuns/r1": { mode: "report", total: 3 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("the check-up", () => {
  it("lets Administrators turn Apply on and read the reports", async () => {
    const alex = signedInAs(env, "alex");
    await assertSucceeds(
      setDoc(doc(alex, "config/maintenance"), {
        apply: true,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(getDoc(doc(alex, "config/maintenance")));
    await assertSucceeds(getDocs(collection(alex, "maintenanceRuns")));
  });

  it("is closed to everyone else, and reports come only from the server", async () => {
    const sam = signedInAs(env, "sam");
    await assertFails(
      setDoc(doc(sam, "config/maintenance"), {
        apply: true,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(getDocs(collection(sam, "maintenanceRuns")));
    await assertFails(
      addDoc(collection(signedInAs(env, "alex"), "maintenanceRuns"), {
        mode: "apply",
      }),
    );
    await assertFails(
      setDoc(doc(signedInAs(env, "alex"), "config/maintenance"), {
        apply: "yes",
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
