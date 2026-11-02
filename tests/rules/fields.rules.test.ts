// File : /TeamSamsara.Workflow/tests/rules/fields.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : Tests fields against the rules: every member reads them; Edit
// workflows makes one under a proper key (never a built-in one); only admins
// change or delete one. Also: Plan events may fill an event's task text again
// from its fields, but not change anything else about it that way.

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
    everyone: {
      name: "Everyone",
      position: 0,
      permissions: ["doAssignedTasks"],
    },
    editor: { name: "Editor", position: 1, permissions: ["editWorkflows"] },
    planner: { name: "Planner", position: 2, permissions: ["planEvents"] },
    admin: { name: "Admin", position: 3, permissions: ["administrator"] },
  },
  grants: {
    doAssignedTasks: ["everyone"],
    editWorkflows: ["editor"],
    planEvents: ["planner"],
    administrator: ["admin"],
  },
};

const field = (changes: Record<string, unknown> = {}) => ({
  name: "Opponent",
  type: "text",
  choices: [],
  help: "",
  createdBy: "eli",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...changes,
});

const stored = (value: Record<string, unknown>) => ({
  ...value,
  createdAt: new Date(2026, 10, 1),
  updatedAt: new Date(2026, 10, 1),
});

const task = {
  title: "Thumbnail vs Kitsune",
  notes: "Use the Kitsune logo.",
  workGroupId: "design",
  memberId: null,
  dueAt: new Date(2027, 0, 8, 17),
  statusId: "todo",
  needsApproval: false,
  tagIds: [],
  posts: null,
  checklist: null,
  links: null,
  asksForLiveLink: false,
  liveLink: null,
  eventId: "match1",
  workflowId: "matchday",
  stepId: "graphic",
  sentForReviewBy: null,
  sentForReviewAt: null,
  approvedBy: null,
  approvedAt: null,
  changesRequested: null,
  createdBy: "pat",
  doneAt: null,
};

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": roles,
    "statuses/todo": {
      name: "To do",
      tone: "neutral",
      category: "open",
      position: 0,
    },
    "members/eli": { status: "active", roleIds: ["editor"], workGroupIds: [] },
    "members/pat": { status: "active", roleIds: ["planner"], workGroupIds: [] },
    "members/ada": { status: "active", roleIds: ["admin"], workGroupIds: [] },
    "members/kai": { status: "active", roleIds: [], workGroupIds: [] },
    "fields/league": stored(
      field({ name: "League", type: "choice", choices: ["NACL"] }),
    ),
    "tasks/t1": stored(task),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("fields", () => {
  it("lets every active member read them", async () => {
    await assertSucceeds(getDoc(doc(signedInAs(env, "kai"), "fields/league")));
  });

  it("lets Edit workflows make one under a proper key", async () => {
    await assertSucceeds(
      setDoc(doc(signedInAs(env, "eli"), "fields/opponent"), field()),
    );
  });

  it("refuses bad keys, built-in keys and bad shapes", async () => {
    const eli = signedInAs(env, "eli");
    await assertFails(setDoc(doc(eli, "fields/Opponent"), field()));
    await assertFails(setDoc(doc(eli, "fields/1st"), field()));
    await assertFails(setDoc(doc(eli, "fields/date"), field()));
    await assertFails(
      setDoc(doc(eli, "fields/opponent"), field({ type: "colour" })),
    );
    await assertFails(
      setDoc(doc(eli, "fields/opponent"), field({ choices: ["A"] })),
    );
    await assertFails(
      setDoc(doc(eli, "fields/opponent"), field({ createdBy: "ada" })),
    );
  });

  it("refuses making one without Edit workflows", async () => {
    await assertFails(
      setDoc(
        doc(signedInAs(env, "pat"), "fields/opponent"),
        field({ createdBy: "pat" }),
      ),
    );
  });

  it("lets only admins change or delete one", async () => {
    const change = { name: "Division", updatedAt: serverTimestamp() };
    await assertFails(
      updateDoc(doc(signedInAs(env, "eli"), "fields/league"), change),
    );
    await assertFails(deleteDoc(doc(signedInAs(env, "eli"), "fields/league")));
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "ada"), "fields/league"), change),
    );
    await assertSucceeds(
      deleteDoc(doc(signedInAs(env, "ada"), "fields/league")),
    );
  });

  it("refuses overwriting a field by making it again", async () => {
    await assertFails(
      setDoc(doc(signedInAs(env, "eli"), "fields/league"), field()),
    );
  });
});

describe("filling an event's tasks again", () => {
  it("lets Plan events change the text of an event's task", async () => {
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "pat"), "tasks/t1"), {
        title: "Thumbnail vs Kitsune Esports",
        notes: "Use the Kitsune Esports logo.",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("doesn't let that change anything else", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "pat"), "tasks/t1"), {
        title: "Thumbnail vs Kitsune Esports",
        workGroupId: "video",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(signedInAs(env, "kai"), "tasks/t1"), {
        title: "Thumbnail vs Kitsune Esports",
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
