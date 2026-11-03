// File : /TeamSamsara.Workflow/tests/rules/repeats.rules.test.ts
// Version : 1.1.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Tests repeats against the rules: every member reads them; Plan
// events makes one with its first events and their tasks, tops up the weeks
// ahead with the same ids, skips a date, ends it and changes it.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  arrayUnion,
  collection,
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
  },
  grants: { doAssignedTasks: ["everyone"], planEvents: ["planner"] },
};

const repeat = (changes: Record<string, unknown> = {}) => ({
  title: "Weekly content meeting",
  eventTypeId: null,
  weekdays: [1],
  time: "10:00",
  minutes: 60,
  startDate: "2026-11-02",
  endKind: "never",
  endDate: null,
  endCount: null,
  skipDates: [],
  link: null,
  details: {},
  notes: "",
  workflowIds: ["meeting"],
  everyone: false,
  groupIds: ["content"],
  memberIds: [],
  createdBy: "pat",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...changes,
});

const event = (date: string, createdBy = "pat") => ({
  title: "Weekly content meeting",
  eventTypeId: null,
  startsAt: new Date(`${date}T10:00:00Z`),
  endsAt: new Date(`${date}T11:00:00Z`),
  link: null,
  details: {},
  workflowIds: ["meeting"],
  notes: "",
  repeatId: "weekly",
  everyone: false,
  groupIds: ["content"],
  memberIds: [],
  createdBy,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const task = (eventId: string, createdBy = "pat") => ({
  title: "Agenda",
  notes: "",
  workGroupId: "content",
  memberId: null,
  dueAt: new Date(2026, 10, 1, 10),
  statusId: "todo",
  needsApproval: false,
  tagIds: [],
  posts: null,
  checklist: null,
  links: null,
  asksForLiveLink: false,
  liveLink: null,
  eventId,
  workflowId: "meeting",
  stepId: "agenda",
  sentForReviewBy: null,
  sentForReviewAt: null,
  approvedBy: null,
  approvedAt: null,
  changesRequested: null,
  createdBy,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  doneAt: null,
});

const stored = (value: Record<string, unknown>) => ({
  ...value,
  createdAt: new Date(2026, 10, 1),
  updatedAt: new Date(2026, 10, 1),
});

/** A batch that makes these dates' events and tasks, ids from the date. */
function topUp(
  db: ReturnType<typeof signedInAs>,
  dates: string[],
  maker = "pat",
  runner = "pat",
) {
  const batch = writeBatch(db);
  for (const date of dates) {
    const eventId = `weekly_${date}`;
    batch.set(doc(db, "events", eventId), event(date, maker));
    // The event belongs to the repeat's maker; its tasks to whoever made them.
    batch.set(
      doc(db, "tasks", `${eventId}_meeting_agenda`),
      task(eventId, runner),
    );
  }
  return batch;
}

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
    "members/lee": { status: "active", roleIds: ["planner"], workGroupIds: [] },
    "members/sam": { status: "active", roleIds: [], workGroupIds: ["content"] },
    "members/chris": {
      status: "disabled",
      roleIds: ["planner"],
      workGroupIds: [],
    },
    "repeats/weekly": stored(repeat()),
    "events/weekly_2026-11-09": stored(event("2026-11-09")),
    "tasks/weekly_2026-11-09_meeting_agenda": stored(task("weekly_2026-11-09")),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("reading repeats", () => {
  it("is for the same people as its events", async () => {
    const repeats = (who: string) =>
      collection(signedInAs(env, who), "repeats");
    await assertSucceeds(
      getDocs(
        query(repeats("sam"), where("groupIds", "array-contains", "content")),
      ),
    );
    await assertSucceeds(
      getDocs(query(repeats("pat"), where("createdBy", "==", "pat"))),
    );
    await assertFails(getDocs(repeats("sam")));
    await assertFails(
      getDocs(
        query(repeats("chris"), where("groupIds", "array-contains", "content")),
      ),
    );
  });
});

describe("making a repeat", () => {
  it("is for Plan events", async () => {
    await assertSucceeds(
      addDoc(collection(signedInAs(env, "pat"), "repeats"), repeat()),
    );
    await assertFails(
      addDoc(
        collection(signedInAs(env, "sam"), "repeats"),
        repeat({ createdBy: "sam" }),
      ),
    );
  });

  it("needs a valid schedule and the server's clock", async () => {
    const repeats = collection(signedInAs(env, "pat"), "repeats");
    await assertFails(addDoc(repeats, repeat({ title: "" })));
    await assertFails(addDoc(repeats, repeat({ weekdays: [] })));
    await assertFails(addDoc(repeats, repeat({ time: "7pm" })));
    await assertFails(addDoc(repeats, repeat({ endKind: "sometimes" })));
    await assertFails(
      addDoc(repeats, repeat({ endKind: "afterCount", endCount: 0 })),
    );
    await assertFails(
      addDoc(repeats, repeat({ endKind: "afterCount", endCount: 201 })),
    );
    await assertFails(
      addDoc(repeats, repeat({ skipDates: Array(61).fill("2026-11-09") })),
    );
    await assertFails(addDoc(repeats, repeat({ createdBy: "sam" })));
    await assertFails(addDoc(repeats, repeat({ createdAt: new Date() })));
    await assertFails(addDoc(repeats, repeat({ colour: "red" })));
    await assertFails(addDoc(repeats, repeat({ minutes: 0 })));
    await assertFails(addDoc(repeats, repeat({ memberIds: "sam" })));
    await assertSucceeds(
      addDoc(repeats, repeat({ endKind: "afterCount", endCount: 10 })),
    );
  });
});

describe("topping up the weeks ahead", () => {
  it("makes the next events and their tasks with ids from their dates", async () => {
    const dates = [
      "2026-11-16",
      "2026-11-23",
      "2026-11-30",
      "2026-12-07",
      "2026-12-14",
    ];
    await assertSucceeds(topUp(signedInAs(env, "pat"), dates).commit());
  });

  it("lets another planner make them, still belonging to the repeat's maker", async () => {
    await assertSucceeds(
      topUp(signedInAs(env, "lee"), ["2026-11-16"], "pat", "lee").commit(),
    );
    await assertFails(
      topUp(signedInAs(env, "lee"), ["2026-11-23"], "sam", "lee").commit(),
    );
  });

  it("lets a planner check which dates are made", async () => {
    await assertSucceeds(
      getDoc(doc(signedInAs(env, "lee"), "events/weekly_2026-11-30")),
    );
  });

  it("can't make one that's already made", async () => {
    await assertFails(topUp(signedInAs(env, "pat"), ["2026-11-09"]).commit());
  });

  it("isn't for other members", async () => {
    await assertFails(topUp(signedInAs(env, "sam"), ["2026-11-16"]).commit());
  });
});

describe("reading a repeat's tasks", () => {
  it("lets Plan events read every event's tasks, to skip or end a repeat", async () => {
    const tasks = collection(signedInAs(env, "pat"), "tasks");
    await assertSucceeds(
      getDocs(
        query(
          tasks,
          where("eventId", "in", ["weekly_2026-11-09", "weekly_2026-11-16"]),
        ),
      ),
    );
    await assertSucceeds(
      getDocs(query(tasks, where("eventId", "==", "weekly_2026-11-09"))),
    );
  });

  it("doesn't open them to other members", async () => {
    const tasks = collection(signedInAs(env, "sam"), "tasks");
    await assertFails(
      getDocs(query(tasks, where("eventId", "==", "weekly_2026-11-09"))),
    );
    await assertSucceeds(
      getDocs(
        query(
          tasks,
          where("eventId", "==", "weekly_2026-11-09"),
          where("workGroupId", "==", "content"),
        ),
      ),
    );
  });
});

describe("changing a repeat", () => {
  it("skips a date: adds it to the skipped and deletes its event and tasks", async () => {
    const db = signedInAs(env, "pat");
    const batch = writeBatch(db);
    batch.update(doc(db, "repeats/weekly"), {
      skipDates: arrayUnion("2026-11-09"),
      updatedAt: serverTimestamp(),
    });
    batch.delete(doc(db, "tasks/weekly_2026-11-09_meeting_agenda"));
    batch.delete(doc(db, "events/weekly_2026-11-09"));
    await assertSucceeds(batch.commit());
  });

  it("ends it on a date", async () => {
    await assertSucceeds(
      updateDoc(doc(signedInAs(env, "pat"), "repeats/weekly"), {
        endKind: "onDate",
        endDate: "2026-11-30",
        endCount: null,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("keeps who made it and when", async () => {
    const ref = doc(signedInAs(env, "pat"), "repeats/weekly");
    await assertFails(
      updateDoc(ref, { createdBy: "sam", updatedAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(ref, { title: "Standup" }));
    await assertSucceeds(
      updateDoc(ref, { title: "Standup", updatedAt: serverTimestamp() }),
    );
  });

  it("isn't for other members", async () => {
    const db = signedInAs(env, "sam");
    await assertFails(
      updateDoc(doc(db, "repeats/weekly"), {
        title: "Mine",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(db, "repeats/other"), repeat({ createdBy: "sam" })),
    );
  });
});
