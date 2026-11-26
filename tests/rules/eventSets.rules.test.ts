// File : /TeamSamsara.Workflow/tests/rules/eventSets.rules.test.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Tests sets of events against the rules: every member reads a set;
// Plan events makes one together with its events and their tasks in one
// batch, renames it and deletes it. An event can't claim a set that doesn't
// exist, and a set's events are found with the same audience queries as the
// calendar's.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
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
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    everyone: {
      name: "Everyone",
      position: 0,
      permissions: ["doAssignedTasks"],
    },
    planner: { name: "Planner", position: 1, permissions: ["planEvents"] },
  },
  grants: { doAssignedTasks: ["everyone"], planEvents: ["planner"] },
};

const eventSet = (changes: Record<string, unknown> = {}) => ({
  name: "Spring Split 2027",
  eventTypeId: "match",
  titlePattern: "vs. {opponent}",
  minutes: 120,
  workflowIds: ["matchday"],
  everyone: false,
  groupIds: ["bloom"],
  memberIds: [],
  createdBy: "pat",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...changes,
});

const event = (changes: Record<string, unknown> = {}) => ({
  title: "vs. Team Nova",
  eventTypeId: "match",
  startsAt: new Date(2027, 0, 9, 17),
  endsAt: new Date(2027, 0, 9, 19),
  link: null,
  details: { opponent: "Team Nova" },
  workflowIds: ["matchday"],
  notes: "",
  repeatId: null,
  setId: "split",
  everyone: false,
  groupIds: ["bloom"],
  memberIds: [],
  createdBy: "pat",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...changes,
});

const task = (eventId: string) => ({
  title: "Matchday graphic",
  notes: "",
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
  eventId,
  workflowId: "matchday",
  stepId: "graphic",
  sentForReviewBy: null,
  sentForReviewAt: null,
  approvedBy: null,
  approvedAt: null,
  changesRequested: null,
  createdBy: "pat",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  doneAt: null,
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
    // lee is in Bloom, so lee sees the set; pat made it.
    "members/lee": { status: "active", roleIds: ["planner"], workGroupIds: ["bloom"] },
    "members/ana": { status: "active", roleIds: ["planner"], workGroupIds: [] },
    "members/kai": { status: "active", roleIds: [], workGroupIds: ["bloom"] },
    "members/sam": { status: "active", roleIds: [], workGroupIds: ["design"] },
    "eventSets/split": stored(eventSet()),
    "events/week1": stored(event()),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("reading sets", () => {
  it("lets every active member read a set", async () => {
    await assertSucceeds(
      getDoc(doc(signedInAs(env, "sam"), "eventSets/split")),
    );
    await assertSucceeds(
      getDocs(collection(signedInAs(env, "kai"), "eventSets")),
    );
  });

  it("finds a set's events with the calendar's audience queries", async () => {
    const events = (who: string) => collection(signedInAs(env, who), "events");
    await assertSucceeds(
      getDocs(
        query(
          events("kai"),
          where("groupIds", "array-contains", "bloom"),
          where("setId", "==", "split"),
        ),
      ),
    );
    await assertSucceeds(
      getDocs(
        query(
          events("pat"),
          where("createdBy", "==", "pat"),
          where("setId", "==", "split"),
        ),
      ),
    );
    // Asking for every event of the set needs View all.
    await assertFails(
      getDocs(query(events("sam"), where("setId", "==", "split"))),
    );
  });
});

describe("planning a set", () => {
  it("lets a planner make a set, its events and their tasks in one batch", async () => {
    const db = signedInAs(env, "lee");
    const batch = writeBatch(db);
    batch.set(doc(db, "eventSets/content"), eventSet({ createdBy: "lee" }));
    batch.set(
      doc(db, "events/c1"),
      event({ setId: "content", createdBy: "lee" }),
    );
    batch.set(doc(db, "tasks/c1_matchday_graphic"), {
      ...task("c1"),
      createdBy: "lee",
    });
    await assertSucceeds(batch.commit());
  });

  it("adds events to a set that already exists", async () => {
    await assertSucceeds(
      setDoc(doc(signedInAs(env, "lee"), "events/week2"), {
        ...event({ createdBy: "lee" }),
      }),
    );
  });

  it("refuses an event claiming a set that doesn't exist", async () => {
    await assertFails(
      setDoc(
        doc(signedInAs(env, "pat"), "events/lost"),
        event({ setId: "nothing" }),
      ),
    );
  });

  it("refuses sets from members who can't plan events", async () => {
    await assertFails(
      setDoc(
        doc(signedInAs(env, "kai"), "eventSets/mine"),
        eventSet({ createdBy: "kai" }),
      ),
    );
  });

  it("refuses sets that don't fit", async () => {
    const db = signedInAs(env, "pat");
    await assertFails(setDoc(doc(db, "eventSets/a"), eventSet({ name: "" })));
    await assertFails(
      setDoc(doc(db, "eventSets/b"), eventSet({ titlePattern: "" })),
    );
    await assertFails(setDoc(doc(db, "eventSets/c"), eventSet({ minutes: 2 })));
    await assertFails(
      setDoc(doc(db, "eventSets/d"), eventSet({ createdBy: "lee" })),
    );
    await assertFails(
      setDoc(doc(db, "eventSets/e"), { ...eventSet(), extra: true }),
    );
  });

  it("still saves events made before sets existed", async () => {
    const old = Object.fromEntries(
      Object.entries(stored(event())).filter(([key]) => key !== "setId"),
    );
    await seed(env, { "events/old": old });
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "pat"), "events/old"), {
        title: "vs. Kitsune",
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe("changing a set", () => {
  it("lets a planner rename it", async () => {
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "lee"), "eventSets/split"), {
        name: "Spring Split",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("refuses a planner who can't see the set", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "ana"), "eventSets/split"), {
        name: "Mine",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("refuses renames from others", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "kai"), "eventSets/split"), {
        name: "Mine",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("lets a planner delete it with its events", async () => {
    const db = signedInAs(env, "pat");
    const batch = writeBatch(db);
    batch.delete(doc(db, "events/week1"));
    batch.delete(doc(db, "eventSets/split"));
    await assertSucceeds(batch.commit());
    await assertFails(deleteDoc(doc(signedInAs(env, "kai"), "eventSets/x")));
  });
});
