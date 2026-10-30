// File : /TeamSamsara.Workflow/tests/rules/workflows.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Tests workflows against the rules: active members read them; only
// Edit workflows (or an Administrator) creates, saves and archives them, with
// valid fields and the server's clock; only archived ones can be deleted.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    everyone: { name: "Everyone", position: 0, permissions: ["viewAll"] },
    planner: {
      name: "Planner",
      position: 1,
      permissions: ["editWorkflows"],
    },
    admin: { name: "Admin", position: 2, permissions: ["administrator"] },
  },
  grants: {
    administrator: ["admin"],
    editWorkflows: ["planner"],
    viewAll: ["everyone"],
  },
};

const step = {
  id: "s1",
  title: "Go-live post",
  notes: "",
  workGroupId: null,
  memberId: null,
  due: { direction: "at", days: 0, hours: 0, minutes: 0, time: null },
  needsApproval: false,
  tagIds: [],
  posts: [{ platformId: "x", formatId: null, texts: { post: "Live! {link}" } }],
  checklist: null,
  links: null,
  asksForLiveLink: true,
};

const newWorkflow = (changes: Record<string, unknown> = {}) => ({
  name: "Livestream",
  description: "Before, during and after a stream.",
  eventTypeId: null,
  archived: false,
  steps: [step],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...changes,
});

const stored = (changes: Record<string, unknown> = {}) => ({
  ...newWorkflow(),
  createdAt: new Date(2026, 0, 1),
  updatedAt: new Date(2026, 0, 1),
  ...changes,
});

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": roles,
    "members/alex": { status: "active", roleIds: ["admin"] },
    "members/jordan": { status: "active", roleIds: ["planner"] },
    "members/sam": { status: "active", roleIds: [] },
    "members/chris": { status: "disabled", roleIds: ["planner"] },
    "workflows/stream": stored(),
    "workflows/old": stored({ name: "Old", archived: true }),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("reading workflows", () => {
  it("is open to active members", async () => {
    await assertSucceeds(
      getDocs(collection(signedInAs(env, "sam"), "workflows")),
    );
  });

  it("is closed to disabled members and visitors", async () => {
    await assertFails(
      getDocs(collection(signedInAs(env, "chris"), "workflows")),
    );
    await assertFails(getDocs(collection(signedOut(env), "workflows")));
  });
});

describe("creating workflows", () => {
  it("is for Edit workflows and Administrators", async () => {
    await assertSucceeds(
      addDoc(collection(signedInAs(env, "jordan"), "workflows"), newWorkflow()),
    );
    await assertSucceeds(
      addDoc(collection(signedInAs(env, "alex"), "workflows"), newWorkflow()),
    );
  });

  it("is not for other members", async () => {
    await assertFails(
      addDoc(collection(signedInAs(env, "sam"), "workflows"), newWorkflow()),
    );
    await assertFails(
      addDoc(collection(signedInAs(env, "chris"), "workflows"), newWorkflow()),
    );
  });

  it("needs valid fields, the server's clock and to start in use", async () => {
    const workflows = collection(signedInAs(env, "jordan"), "workflows");
    await assertFails(addDoc(workflows, newWorkflow({ name: "" })));
    await assertFails(
      addDoc(workflows, newWorkflow({ description: "x".repeat(301) })),
    );
    await assertFails(addDoc(workflows, newWorkflow({ steps: "none" })));
    await assertFails(
      addDoc(
        workflows,
        newWorkflow({ steps: Array.from({ length: 41 }, () => step) }),
      ),
    );
    await assertFails(addDoc(workflows, newWorkflow({ eventTypeId: 4 })));
    await assertFails(addDoc(workflows, newWorkflow({ archived: true })));
    await assertFails(
      addDoc(workflows, newWorkflow({ createdAt: new Date() })),
    );
    await assertFails(addDoc(workflows, newWorkflow({ owner: "jordan" })));
  });
});

describe("saving workflows", () => {
  it("is for Edit workflows, with the server's clock", async () => {
    const workflow = doc(signedInAs(env, "jordan"), "workflows/stream");
    await assertSucceeds(
      updateDoc(workflow, {
        name: "Stream night",
        steps: [step, { ...step, id: "s2" }],
        eventTypeId: "livestream",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(workflow, { archived: true, updatedAt: serverTimestamp() }),
    );
  });

  it("is not for other members, or without the clock", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "sam"), "workflows/stream"), {
        name: "Mine",
        updatedAt: serverTimestamp(),
      }),
    );
    const workflow = doc(signedInAs(env, "jordan"), "workflows/stream");
    await assertFails(updateDoc(workflow, { name: "No clock" }));
    await assertFails(
      updateDoc(workflow, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe("deleting workflows", () => {
  it("works once archived, for Edit workflows", async () => {
    await assertFails(
      deleteDoc(doc(signedInAs(env, "jordan"), "workflows/stream")),
    );
    await assertFails(deleteDoc(doc(signedInAs(env, "sam"), "workflows/old")));
    await assertSucceeds(
      deleteDoc(doc(signedInAs(env, "jordan"), "workflows/old")),
    );
  });
});
