// File : /TeamSamsara.Workflow/tests/rules/tasks.rules.test.ts
// Version : 2.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests tasks against the rules: who reads them (everything with
// View all, else what's theirs), who makes standalone ones, and the four kinds
// of change: doing (status, checklist, link, review; no finishing before
// approval), approving, reassigning and editing (and the parts edited by
// hand). Plus deleting, and the
// "Late from the start" mark: only on a task already due, and never changed.

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
    viewer: { name: "Viewer", position: 1, permissions: ["viewAll"] },
    planner: {
      name: "Planner",
      position: 2,
      permissions: ["createStandaloneTasks"],
    },
    reviewer: { name: "Reviewer", position: 3, permissions: ["approveTasks"] },
    organiser: {
      name: "Organiser",
      position: 4,
      permissions: ["reassignTasks"],
    },
    editor: { name: "Editor", position: 5, permissions: ["editAnyTask"] },
    eventPlanner: {
      name: "Event planner",
      position: 6,
      permissions: ["planEvents"],
    },
  },
  grants: {
    doAssignedTasks: ["everyone"],
    viewAll: ["viewer"],
    createStandaloneTasks: ["planner"],
    approveTasks: ["reviewer"],
    reassignTasks: ["organiser"],
    editAnyTask: ["editor"],
    planEvents: ["eventPlanner"],
  },
};

const member = (
  roleIds: string[],
  workGroupIds: string[] = [],
  extra: Record<string, unknown> = {},
) => ({
  status: "active",
  roleIds,
  workGroupIds,
  ...extra,
});

const stored = (changes: Record<string, unknown> = {}) => ({
  title: "Matchday graphic",
  notes: "",
  workGroupId: "design",
  memberId: null,
  dueAt: new Date(2026, 10, 9, 19),
  statusId: "todo",
  needsApproval: false,
  tagIds: [],
  posts: null,
  checklist: [
    { id: "a", text: "Logos", done: false },
    { id: "b", text: "Time", done: false },
  ],
  links: null,
  asksForLiveLink: false,
  liveLink: null,
  eventId: null,
  workflowId: null,
  stepId: null,
  sentForReviewBy: null,
  sentForReviewAt: null,
  approvedBy: null,
  approvedAt: null,
  changesRequested: null,
  createdBy: "pat",
  createdAt: new Date(2026, 10, 1),
  updatedAt: new Date(2026, 10, 1),
  doneAt: null,
  ...changes,
});

const fresh = (createdBy: string, changes: Record<string, unknown> = {}) => ({
  ...stored({ createdBy, ...changes }),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const now = () => ({ updatedAt: serverTimestamp() });
const task = (as: string, id = "graphic") =>
  doc(signedInAs(env, as), "tasks", id);

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
    "statuses/review": {
      name: "In review",
      tone: "info",
      category: "awaitingApproval",
      position: 1,
    },
    "statuses/done": {
      name: "Done",
      tone: "success",
      category: "finished",
      position: 2,
    },
    // sam is in Design; gwen in Social; vic sees all; pat makes tasks.
    "members/sam": member([], ["design"]),
    "members/gwen": member([], ["social"]),
    "members/vic": member(["viewer"]),
    "members/pat": member(["planner"]),
    "members/rae": member(["reviewer"]),
    "members/ollie": member(["organiser"]),
    "members/eddie": member(["editor"]),
    "members/pia": member(["eventPlanner"], [], { rank: 6 }),
    // lena leads Design without any permission; boss outranks everyone.
    "members/lena": member([], ["design"], { leadOf: ["design"], rank: 1 }),
    "members/boss": member(["reviewer"], [], { rank: 9 }),
    "members/pia2": member(["eventPlanner"], [], { rank: 6 }),
    "events/match1": {
      title: "vs. Orca",
      everyone: false,
      memberIds: ["pia"],
      groupIds: [],
      createdBy: "pia",
    },
    "members/chris": {
      status: "disabled",
      roleIds: ["viewer"],
      workGroupIds: ["design"],
    },
    "tasks/graphic": stored(),
    "tasks/signoff": stored({
      title: "Sponsor post",
      needsApproval: true,
      workGroupId: "social",
    }),
    "tasks/fromEvent": stored({
      eventId: "match1",
      workflowId: "w1",
      stepId: "s1",
    }),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("reading tasks", () => {
  it("is open to View all and editors; approvers see what's waiting for review", async () => {
    await assertSucceeds(getDocs(collection(signedInAs(env, "vic"), "tasks")));
    await assertSucceeds(
      getDocs(collection(signedInAs(env, "eddie"), "tasks")),
    );
    const rae = signedInAs(env, "rae");
    await assertFails(getDocs(collection(rae, "tasks")));
    await assertSucceeds(
      getDocs(query(collection(rae, "tasks"), where("statusId", "in", ["review"]))),
    );
  });

  it("shows planners an event's tasks only when they can see the event", async () => {
    await assertSucceeds(
      getDocs(query(collection(signedInAs(env, "pia"), "tasks"), where("eventId", "==", "match1"))),
    );
    await assertFails(
      getDocs(query(collection(signedInAs(env, "pia2"), "tasks"), where("eventId", "==", "match1"))),
    );
    await assertFails(getDoc(doc(signedInAs(env, "pia2"), "tasks/fromEvent")));
  });

  it("shows a lead their group's tasks", async () => {
    await assertSucceeds(
      getDocs(query(collection(signedInAs(env, "lena"), "tasks"), where("workGroupId", "==", "design"))),
    );
  });

  it("is limited to their own tasks for everyone else", async () => {
    const sam = signedInAs(env, "sam");
    await assertFails(getDocs(collection(sam, "tasks")));
    await assertSucceeds(getDoc(doc(sam, "tasks/graphic")));
    await assertFails(getDoc(doc(sam, "tasks/signoff")));
    await assertSucceeds(
      getDocs(
        query(
          collection(sam, "tasks"),
          where("workGroupId", "==", "design"),
          where("doneAt", "==", null),
        ),
      ),
    );
    await assertSucceeds(
      getDocs(query(collection(sam, "tasks"), where("memberId", "==", "sam"))),
    );
    await assertFails(
      getDocs(
        query(collection(sam, "tasks"), where("workGroupId", "==", "social")),
      ),
    );
  });

  it("lets the maker read what they made, and shuts out disabled members", async () => {
    await assertSucceeds(getDoc(doc(signedInAs(env, "pat"), "tasks/signoff")));
    await assertFails(getDoc(doc(signedInAs(env, "chris"), "tasks/graphic")));
  });
});

describe("making standalone tasks", () => {
  it("is for Create standalone tasks, as themselves, starting fresh", async () => {
    const tasks = collection(signedInAs(env, "pat"), "tasks");
    await assertSucceeds(addDoc(tasks, fresh("pat")));
    await assertFails(addDoc(tasks, fresh("sam")));
    await assertFails(addDoc(tasks, fresh("pat", { doneAt: new Date() })));
    await assertFails(addDoc(tasks, fresh("pat", { approvedBy: "pat" })));
    await assertFails(addDoc(tasks, fresh("pat", { statusId: "nope" })));
    await assertFails(addDoc(tasks, fresh("pat", { eventId: "match1" })));
    await assertFails(
      addDoc(collection(signedInAs(env, "sam"), "tasks"), fresh("sam")),
    );
  });

  it("needs valid fields", async () => {
    const tasks = collection(signedInAs(env, "pat"), "tasks");
    await assertFails(addDoc(tasks, fresh("pat", { title: "" })));
    await assertFails(addDoc(tasks, fresh("pat", { dueAt: "tomorrow" })));
    await assertFails(addDoc(tasks, fresh("pat", { colour: "red" })));
  });
});

describe("late from the start", () => {
  it("can be set only when the task is already due", async () => {
    const tasks = collection(signedInAs(env, "pat"), "tasks");
    await assertSucceeds(
      addDoc(tasks, fresh("pat", { lateAtCreation: true })),
    );
    await assertSucceeds(
      addDoc(tasks, fresh("pat", { lateAtCreation: false })),
    );
    await assertFails(
      addDoc(
        tasks,
        fresh("pat", {
          lateAtCreation: true,
          dueAt: new Date(Date.now() + 86_400_000),
        }),
      ),
    );
    await assertFails(addDoc(tasks, fresh("pat", { lateAtCreation: "yes" })));
  });

  it("never changes afterwards, and older tasks without it still save", async () => {
    await assertFails(
      updateDoc(task("eddie"), { lateAtCreation: true, ...now() }),
    );
    await assertSucceeds(
      updateDoc(task("eddie"), { title: "Older task, no mark", ...now() }),
    );
  });
});

describe("who finished it", () => {
  it("is recorded as whoever finishes it, never someone else", async () => {
    await assertSucceeds(
      updateDoc(task("sam"), {
        statusId: "done",
        doneAt: serverTimestamp(),
        doneBy: "sam",
        ...now(),
      }),
    );
    await assertFails(
      updateDoc(task("sam", "graphic"), { doneBy: "gwen", ...now() }),
    );
  });

  it("is cleared when it's reopened", async () => {
    await seedDone();
    await assertSucceeds(
      updateDoc(task("sam"), {
        statusId: "todo",
        doneAt: null,
        doneBy: null,
        ...now(),
      }),
    );
  });
});

async function seedDone() {
  await seed(env, {
    "tasks/graphic": stored({
      statusId: "done",
      doneAt: new Date(2026, 10, 5),
      doneBy: "sam",
    }),
  });
}

describe("keeping a finished task as history", () => {
  it("is for planners, in the batch that deletes its event", async () => {
    const db = signedInAs(env, "pia");
    const batch = writeBatch(db);
    batch.update(doc(db, "tasks/fromEvent"), {
      eventGone: { title: "vs. Orca", startsAt: new Date(2026, 10, 6) },
      ...now(),
    });
    batch.delete(doc(db, "events/match1"));
    await assertSucceeds(batch.commit());
  });

  it("can't be set while the event still exists", async () => {
    await assertFails(
      updateDoc(task("pia", "fromEvent"), {
        eventGone: { title: "vs. Orca", startsAt: null },
        ...now(),
      }),
    );
  });
});

describe("doing a task", () => {
  it("lets the group tick the checklist, add the link and finish it", async () => {
    await assertSucceeds(
      updateDoc(task("sam"), {
        checklist: [
          { id: "a", text: "Logos", done: true },
          { id: "b", text: "Time", done: false },
        ],
        ...now(),
      }),
    );
    await assertSucceeds(
      updateDoc(task("sam"), { liveLink: "https://x.com/p/1", ...now() }),
    );
    await assertSucceeds(
      updateDoc(task("sam"), {
        statusId: "done",
        doneAt: serverTimestamp(),
        ...now(),
      }),
    );
  });

  it("isn't for people the task isn't given to", async () => {
    await assertFails(updateDoc(task("gwen"), { statusId: "done", ...now() }));
    await assertFails(updateDoc(task("vic"), { statusId: "done", ...now() }));
  });

  it("can't change the details, the checklist's length, or skip the clock", async () => {
    await assertFails(updateDoc(task("sam"), { title: "Mine", ...now() }));
    await assertFails(
      updateDoc(task("sam"), { workGroupId: "social", ...now() }),
    );
    await assertFails(updateDoc(task("sam"), { checklist: [], ...now() }));
    await assertFails(
      updateDoc(task("sam"), { liveLink: "https://x.com/p/1" }),
    );
  });

  it("sends a task needing approval for review, but can't finish or approve it", async () => {
    const gwen = (changes: Record<string, unknown>) =>
      updateDoc(task("gwen", "signoff"), { ...changes, ...now() });
    await assertFails(gwen({ statusId: "done", doneAt: serverTimestamp() }));
    await assertFails(
      gwen({ approvedBy: "gwen", approvedAt: serverTimestamp() }),
    );
    await assertSucceeds(
      gwen({
        statusId: "review",
        sentForReviewBy: "gwen",
        sentForReviewAt: serverTimestamp(),
      }),
    );
  });

  it("finishes a task needing approval once it's approved", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "tasks/signoff"), {
        approvedBy: "rae",
        approvedAt: new Date(),
      });
    });
    await assertSucceeds(
      updateDoc(task("gwen", "signoff"), {
        statusId: "done",
        doneAt: serverTimestamp(),
        ...now(),
      }),
    );
  });
});

async function sendForReview(id: string, by: string) {
  await env.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), "tasks", id), {
      statusId: "review",
      sentForReviewBy: by,
      sentForReviewAt: new Date(),
    });
  });
}

describe("approving a task", () => {
  it("lets Approve tasks approve, or ask for changes", async () => {
    await sendForReview("signoff", "gwen");
    await sendForReview("graphic", "sam");
    await assertSucceeds(
      updateDoc(task("rae", "signoff"), {
        statusId: "done",
        approvedBy: "rae",
        approvedAt: serverTimestamp(),
        doneAt: serverTimestamp(),
        ...now(),
      }),
    );
    await assertSucceeds(
      updateDoc(task("rae", "graphic"), {
        statusId: "todo",
        changesRequested: "Bigger logos",
        ...now(),
      }),
    );
  });

  it("never lets anyone approve their own work", async () => {
    await sendForReview("signoff", "rae");
    await assertFails(
      updateDoc(task("rae", "signoff"), {
        statusId: "done",
        approvedBy: "rae",
        approvedAt: serverTimestamp(),
        doneAt: serverTimestamp(),
        ...now(),
      }),
    );
  });

  it("only approves work done by someone at or below them", async () => {
    await sendForReview("signoff", "boss");
    await assertFails(
      updateDoc(task("rae", "signoff"), {
        approvedBy: "rae",
        approvedAt: serverTimestamp(),
        ...now(),
      }),
    );
  });

  it("lets a lead approve their group's task without Approve tasks", async () => {
    await sendForReview("graphic", "sam");
    await assertSucceeds(
      updateDoc(task("lena", "graphic"), {
        approvedBy: "lena",
        approvedAt: serverTimestamp(),
        ...now(),
      }),
    );
    await sendForReview("signoff", "gwen");
    await assertFails(
      updateDoc(task("lena", "signoff"), {
        approvedBy: "lena",
        approvedAt: serverTimestamp(),
        ...now(),
      }),
    );
  });

  it("can't approve a task that isn't waiting for review", async () => {
    await assertFails(
      updateDoc(task("rae", "signoff"), {
        approvedBy: "rae",
        approvedAt: serverTimestamp(),
        ...now(),
      }),
    );
  });

  it("can't be done with Edit any task", async () => {
    await sendForReview("signoff", "gwen");
    await assertFails(
      updateDoc(task("eddie", "signoff"), {
        approvedBy: "eddie",
        approvedAt: serverTimestamp(),
        ...now(),
      }),
    );
  });

  it("can't approve in someone else's name or change the details", async () => {
    await sendForReview("signoff", "gwen");
    await assertFails(
      updateDoc(task("rae", "signoff"), {
        approvedBy: "vic",
        approvedAt: serverTimestamp(),
        ...now(),
      }),
    );
    await assertFails(
      updateDoc(task("rae", "signoff"), { title: "New", ...now() }),
    );
  });
});

describe("reassigning and editing", () => {
  it("lets Reassign tasks change only who it's given to", async () => {
    await assertSucceeds(
      updateDoc(task("ollie"), {
        workGroupId: null,
        memberId: "gwen",
        ...now(),
      }),
    );
    await assertFails(updateDoc(task("ollie"), { title: "New", ...now() }));
  });

  it("lets a lead reassign within their group only", async () => {
    await assertSucceeds(
      updateDoc(task("lena"), { memberId: "sam", ...now() }),
    );
    await assertFails(
      updateDoc(task("lena"), { workGroupId: "social", ...now() }),
    );
  });

  it("never hands a task to someone above them, or turned off", async () => {
    await assertFails(
      updateDoc(task("ollie"), { memberId: "boss", ...now() }),
    );
    await assertFails(
      updateDoc(task("ollie"), { memberId: "chris", ...now() }),
    );
  });

  it("lets a group member claim its waiting task for themselves", async () => {
    await assertSucceeds(
      updateDoc(task("sam"), { memberId: "sam", ...now() }),
    );
    await assertFails(
      updateDoc(task("gwen"), { memberId: "gwen", ...now() }),
    );
  });

  it("lets Edit any task change its content, never its status or approval", async () => {
    await assertFails(
      updateDoc(task("eddie"), { statusId: "done", ...now() }),
    );
  });

  it("lets Edit any task change anything but where it came from", async () => {
    await assertSucceeds(
      updateDoc(task("eddie"), {
        title: "Matchday graphic v2",
        needsApproval: true,
        dueAt: new Date(2026, 10, 10),
        ...now(),
      }),
    );
    await assertFails(
      updateDoc(task("eddie", "fromEvent"), { eventId: null, ...now() }),
    );
    await assertFails(
      updateDoc(task("eddie"), { createdBy: "eddie", ...now() }),
    );
  });

  it("records which parts were changed by hand, from a known list", async () => {
    await assertSucceeds(
      updateDoc(task("ollie"), {
        workGroupId: null,
        memberId: "gwen",
        editedParts: ["assignee"],
        ...now(),
      }),
    );
    await assertSucceeds(
      updateDoc(task("eddie"), {
        title: "Mine now",
        editedParts: ["assignee", "title"],
        ...now(),
      }),
    );
    await assertFails(
      updateDoc(task("eddie"), { editedParts: ["status"], ...now() }),
    );
    await assertFails(
      updateDoc(task("eddie"), { editedParts: "title", ...now() }),
    );
  });

  it("lets the maker of a standalone task edit it, not an event's", async () => {
    await assertSucceeds(
      updateDoc(task("pat"), { title: "Renamed", ...now() }),
    );
    await assertFails(
      updateDoc(task("pat", "fromEvent"), { title: "Renamed", ...now() }),
    );
  });
});

describe("deleting tasks", () => {
  it("is for Edit any task or the maker of a standalone one, and planners for an event's", async () => {
    await assertFails(deleteDoc(task("sam")));
    await assertFails(deleteDoc(task("pat", "fromEvent")));
    await assertFails(deleteDoc(task("eddie", "fromEvent")));
    await assertFails(deleteDoc(task("pia2", "fromEvent")));
    await assertSucceeds(deleteDoc(task("pia", "fromEvent")));
    await assertSucceeds(deleteDoc(task("pat")));
  });
});
