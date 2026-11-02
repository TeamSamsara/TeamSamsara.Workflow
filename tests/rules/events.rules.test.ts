// File : /TeamSamsara.Workflow/tests/rules/events.rules.test.ts
// Version : 1.1.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Tests events against the rules: every member reads them; Plan
// events makes one together with its tasks in one batch, changes it, moves its
// tasks' due times, adds tasks to it and deletes it with its tasks. Tasks can't
// claim an event that doesn't exist.

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
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    everyone: {
      name: "Everyone",
      position: 0,
      permissions: ["doAssignedTasks"],
    },
    planner: { name: "Planner", position: 1, permissions: ["planEvents"] },
    viewer: { name: "Viewer", position: 2, permissions: ["viewAll"] },
  },
  grants: {
    doAssignedTasks: ["everyone"],
    planEvents: ["planner"],
    viewAll: ["viewer"],
  },
};

const event = (changes: Record<string, unknown> = {}) => ({
  title: "vs. Team Nova",
  eventTypeId: null,
  startsAt: new Date(2026, 10, 9, 19),
  endsAt: new Date(2026, 10, 9, 21),
  link: null,
  details: { opponent: "Team Nova" },
  workflowIds: ["matchday"],
  notes: "",
  repeatId: null,
  everyone: true,
  groupIds: [],
  memberIds: [],
  createdBy: "pat",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...changes,
});

const task = (
  eventId: string | null,
  changes: Record<string, unknown> = {},
) => ({
  title: "Matchday graphic",
  notes: "",
  workGroupId: "design",
  memberId: null,
  dueAt: new Date(2026, 10, 8, 19),
  statusId: "todo",
  needsApproval: false,
  tagIds: [],
  posts: null,
  checklist: null,
  links: null,
  asksForLiveLink: false,
  liveLink: null,
  eventId,
  workflowId: eventId ? "matchday" : null,
  stepId: eventId ? "graphic" : null,
  sentForReviewBy: null,
  sentForReviewAt: null,
  approvedBy: null,
  approvedAt: null,
  changesRequested: null,
  createdBy: "pat",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  doneAt: null,
  ...changes,
});

const stored = (value: Record<string, unknown>) => ({
  ...value,
  createdAt: new Date(2026, 10, 1),
  updatedAt: new Date(2026, 10, 1),
});

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
    "members/pat": { status: "active", roleIds: ["planner"], workGroupIds: [] },
    "members/sam": { status: "active", roleIds: [], workGroupIds: ["design"] },
    "members/kai": { status: "active", roleIds: [], workGroupIds: ["bloom"] },
    "members/vic": { status: "active", roleIds: ["viewer"], workGroupIds: [] },
    "members/chris": {
      status: "disabled",
      roleIds: ["planner"],
      workGroupIds: [],
    },
    "events/match": stored(event()),
    "events/scrims": stored(
      event({ title: "Bloom scrims", everyone: false, groupIds: ["bloom"] }),
    ),
    "events/shoot": stored(
      event({ title: "Player intros", everyone: false, memberIds: ["sam"] }),
    ),
    "events/sponsor": stored(
      event({ title: "Sponsor call", everyone: false, groupIds: ["partners"] }),
    ),
    "tasks/graphic": stored(task("match")),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("who sees an event", () => {
  const events = (who: string) => collection(signedInAs(env, who), "events");

  it("shows events for Everyone to every active member", async () => {
    await assertSucceeds(
      getDocs(query(events("sam"), where("everyone", "==", true))),
    );
    await assertFails(
      getDocs(
        query(
          collection(signedInAs(env, "chris"), "events"),
          where("everyone", "==", true),
        ),
      ),
    );
    await assertFails(
      getDocs(
        query(
          collection(signedOut(env), "events"),
          where("everyone", "==", true),
        ),
      ),
    );
  });

  it("shows events to the people in them", async () => {
    await assertSucceeds(
      getDocs(
        query(events("sam"), where("memberIds", "array-contains", "sam")),
      ),
    );
    await assertSucceeds(getDoc(doc(signedInAs(env, "sam"), "events/shoot")));
    await assertFails(getDoc(doc(signedInAs(env, "kai"), "events/shoot")));
  });

  it("shows events to the work groups in them, one group at a time", async () => {
    await assertSucceeds(
      getDocs(
        query(events("kai"), where("groupIds", "array-contains", "bloom")),
      ),
    );
    await assertSucceeds(getDoc(doc(signedInAs(env, "kai"), "events/scrims")));
    await assertFails(
      getDocs(
        query(events("sam"), where("groupIds", "array-contains", "bloom")),
      ),
    );
    await assertFails(getDoc(doc(signedInAs(env, "sam"), "events/scrims")));
  });

  it("shows events to the work groups in them, all groups at once", async () => {
    await assertSucceeds(
      getDocs(
        query(
          events("kai"),
          where("groupIds", "array-contains-any", ["bloom"]),
        ),
      ),
    );
  });

  it("shows events to whoever made them", async () => {
    await assertSucceeds(
      getDocs(query(events("pat"), where("createdBy", "==", "pat"))),
    );
    await assertSucceeds(getDoc(doc(signedInAs(env, "pat"), "events/sponsor")));
  });

  it("shows everything to View all, and nothing unasked to others", async () => {
    await assertSucceeds(getDocs(events("vic")));
    await assertFails(getDocs(events("sam")));
    await assertFails(getDoc(doc(signedInAs(env, "sam"), "events/sponsor")));
  });

  it("lets anyone check that an event doesn't exist", async () => {
    await assertSucceeds(getDoc(doc(signedInAs(env, "sam"), "events/nowhere")));
  });
});

describe("making an event", () => {
  it("writes the event and its tasks in one batch, for Plan events", async () => {
    const db = signedInAs(env, "pat");
    const batch = writeBatch(db);
    const eventRef = doc(collection(db, "events"));
    batch.set(eventRef, event());
    batch.set(doc(collection(db, "tasks")), task(eventRef.id));
    batch.set(
      doc(collection(db, "tasks")),
      task(eventRef.id, { title: "Results post" }),
    );
    await assertSucceeds(batch.commit());
  });

  it("isn't for other members", async () => {
    const db = signedInAs(env, "sam");
    await assertFails(
      addDoc(collection(db, "events"), event({ createdBy: "sam" })),
    );
  });

  it("needs valid fields and the server's clock", async () => {
    const events = collection(signedInAs(env, "pat"), "events");
    await assertFails(addDoc(events, event({ title: "" })));
    await assertFails(addDoc(events, event({ startsAt: "Monday" })));
    await assertFails(
      addDoc(events, event({ workflowIds: ["a", "b", "c", "d", "e", "f"] })),
    );
    await assertFails(addDoc(events, event({ createdBy: "sam" })));
    await assertFails(addDoc(events, event({ createdAt: new Date() })));
    await assertFails(addDoc(events, event({ colour: "red" })));
    await assertFails(
      addDoc(events, event({ endsAt: new Date(2026, 10, 9, 18) })),
    );
    await assertFails(addDoc(events, event({ groupIds: "bloom" })));
    await assertFails(addDoc(events, event({ everyone: "yes" })));
  });

  it("can't make tasks for an event that doesn't exist", async () => {
    const tasks = collection(signedInAs(env, "pat"), "tasks");
    await assertFails(addDoc(tasks, task("nowhere")));
    await assertSucceeds(addDoc(tasks, task("match")));
  });
});

describe("changing an event", () => {
  it("lets Plan events change it and move its tasks", async () => {
    const db = signedInAs(env, "pat");
    const batch = writeBatch(db);
    batch.update(doc(db, "events/match"), {
      startsAt: new Date(2026, 10, 9, 20),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, "tasks/graphic"), {
      dueAt: new Date(2026, 10, 8, 20),
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it("doesn't let Plan events change an event task's other details", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "pat"), "tasks/graphic"), {
        title: "Mine",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("isn't for other members", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "sam"), "events/match"), {
        title: "Mine",
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe("deleting an event", () => {
  it("deletes it with its tasks, for Plan events", async () => {
    const db = signedInAs(env, "pat");
    const batch = writeBatch(db);
    batch.delete(doc(db, "tasks/graphic"));
    batch.delete(doc(db, "events/match"));
    await assertSucceeds(batch.commit());
  });

  it("isn't for other members", async () => {
    await assertFails(deleteDoc(doc(signedInAs(env, "sam"), "events/match")));
    await assertFails(deleteDoc(doc(signedInAs(env, "sam"), "tasks/graphic")));
  });
});
