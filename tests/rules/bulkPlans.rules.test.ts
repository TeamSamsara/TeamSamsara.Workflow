// File : /TeamSamsara.Workflow/tests/rules/bulkPlans.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests the record of a set or repeat being planned against the
// rules: made by planners as themselves, on the server's clock, for a set or
// repeat that exists; nobody reads, changes or deletes it from the app.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    planner: { name: "Planner", position: 1, permissions: ["planEvents"] },
  },
  grants: { planEvents: ["planner"] },
};

const record = (changes: Record<string, unknown> = {}) => ({
  kind: "set",
  sourceId: "fall",
  name: "ACL Fall 2026",
  eventIds: ["e1", "e2"],
  byId: "jordan",
  at: serverTimestamp(),
  ...changes,
});

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": roles,
    "members/jordan": { status: "active", roleIds: ["planner"] },
    "members/sam": { status: "active", roleIds: [] },
    "eventSets/fall": { name: "ACL Fall 2026" },
    "repeats/practice": { title: "Practice" },
    "bulkPlans/old": { ...record(), at: new Date(2026, 0, 1) },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("recording a planned set or repeat", () => {
  it("is for planners, for a set or repeat that exists", async () => {
    const plans = (id: string) =>
      doc(signedInAs(env, "jordan"), "bulkPlans", id);
    await assertSucceeds(setDoc(plans("a"), record()));
    await assertSucceeds(
      setDoc(plans("b"), record({ kind: "repeat", sourceId: "practice" })),
    );
    await assertFails(setDoc(plans("c"), record({ sourceId: "gone" })));
    await assertFails(
      setDoc(plans("d"), record({ kind: "repeat", sourceId: "fall" })),
    );
  });

  it("is not for other members, or made as someone else", async () => {
    await assertFails(
      setDoc(
        doc(signedInAs(env, "sam"), "bulkPlans", "a"),
        record({ byId: "sam" }),
      ),
    );
    await assertFails(
      setDoc(
        doc(signedInAs(env, "jordan"), "bulkPlans", "b"),
        record({ byId: "sam" }),
      ),
    );
  });

  it("needs valid fields and the server's clock", async () => {
    const plans = (id: string) =>
      doc(signedInAs(env, "jordan"), "bulkPlans", id);
    await assertFails(setDoc(plans("a"), record({ eventIds: [] })));
    await assertFails(setDoc(plans("b"), record({ kind: "other" })));
    await assertFails(setDoc(plans("c"), record({ at: new Date() })));
    await assertFails(setDoc(plans("d"), record({ name: "" })));
    await assertFails(setDoc(plans("e"), record({ extra: 1 })));
  });

  it("can't be read, changed or deleted from the app", async () => {
    const old = doc(signedInAs(env, "jordan"), "bulkPlans", "old");
    await assertFails(getDoc(old));
    await assertFails(updateDoc(old, { name: "x" }));
    await assertFails(deleteDoc(old));
  });
});
