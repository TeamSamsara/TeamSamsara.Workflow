// File : /TeamSamsara.Workflow/tests/rules/workflowSyncs.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests the record of a workflow sync against the rules: made by
// planners who edit workflows, as themselves and on the server's clock, for a
// workflow that exists; nobody reads, changes or deletes it from the app.

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
    planner: {
      name: "Planner",
      position: 1,
      permissions: ["editWorkflows", "planEvents"],
    },
    editor: { name: "Editor", position: 2, permissions: ["editWorkflows"] },
  },
  grants: {
    editWorkflows: ["planner", "editor"],
    planEvents: ["planner"],
  },
};

const record = (changes: Record<string, unknown> = {}) => ({
  workflowId: "promo",
  workflowName: "Match day",
  byId: "jordan",
  taskIds: ["t1", "t2"],
  taskCount: 2,
  changes: ["Prep caption is now due 2 days before at 11:30 PM."],
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
    "members/riley": { status: "active", roleIds: ["editor"] },
    "members/sam": { status: "active", roleIds: [] },
    "workflows/promo": { name: "Match day" },
    "workflowSyncs/old": { ...record(), at: new Date(2026, 0, 1) },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("recording a workflow sync", () => {
  it("is for planners who edit workflows", async () => {
    const db = signedInAs(env, "jordan");
    await assertSucceeds(setDoc(doc(db, "workflowSyncs", "s1"), record()));
  });

  it("is not for editors who don't plan events, or other members", async () => {
    await assertFails(
      setDoc(
        doc(signedInAs(env, "riley"), "workflowSyncs", "s1"),
        record({ byId: "riley" }),
      ),
    );
    await assertFails(
      setDoc(
        doc(signedInAs(env, "sam"), "workflowSyncs", "s1"),
        record({ byId: "sam" }),
      ),
    );
  });

  it("is made as yourself, for a real workflow, with valid fields", async () => {
    const syncs = (id: string) =>
      doc(signedInAs(env, "jordan"), "workflowSyncs", id);
    await assertFails(setDoc(syncs("a"), record({ byId: "sam" })));
    await assertFails(setDoc(syncs("b"), record({ workflowId: "gone" })));
    await assertFails(setDoc(syncs("c"), record({ taskIds: [] })));
    await assertFails(setDoc(syncs("d"), record({ taskCount: 1 })));
    await assertFails(setDoc(syncs("e"), record({ at: new Date() })));
    await assertFails(setDoc(syncs("f"), record({ extra: true })));
    await assertFails(
      setDoc(syncs("g"), record({ changes: ["1", "2", "3", "4", "5", "6"] })),
    );
  });

  it("can't be read, changed or deleted from the app", async () => {
    const old = doc(signedInAs(env, "jordan"), "workflowSyncs", "old");
    await assertFails(getDoc(old));
    await assertFails(updateDoc(old, { taskCount: 3 }));
    await assertFails(deleteDoc(old));
  });
});
