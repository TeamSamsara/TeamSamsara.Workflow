// File : /TeamSamsara.Workflow/tests/rules/spike.rules.test.ts
// Version : 0.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Temporary: proves the two risky checks of the new permission model
// in the emulator before the real rules are rewritten (rank compared through
// members.rank, and tasks listed one visible event at a time). Removed once the
// rules rewrite lands.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-workflow-rules",
    firestore: { rules: readFileSync(path.join(here, "spike.rules"), "utf8") },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const set = (p: string, d: object) => db.doc(p).set(d);
    await set("config/roles", { grants: { approveTasks: ["lead"] } });
    await set("statuses/review", { category: "awaitingApproval" });
    await set("members/planner", {
      rank: 5,
      planner: true,
      workGroupIds: ["design"],
      roleIds: ["lead"],
    });
    await set("members/boss", {
      rank: 9,
      planner: false,
      workGroupIds: [],
      roleIds: ["lead"],
    });
    await set("members/junior", {
      rank: 2,
      planner: false,
      workGroupIds: [],
      roleIds: [],
    });
    await set("members/peer", {
      rank: 5,
      planner: false,
      workGroupIds: [],
      roleIds: [],
    });
    await set("events/seen", {
      everyone: false,
      memberIds: [],
      groupIds: ["design"],
      createdBy: "x",
    });
    await set("events/hidden", {
      everyone: false,
      memberIds: [],
      groupIds: ["other"],
      createdBy: "x",
    });
    const task = (memberId: string, eventId: string) => ({
      memberId,
      eventId,
      statusId: "review",
      approvedBy: null,
    });
    await set("tasks/seen1", task("junior", "seen"));
    await set("tasks/seen2", task("boss", "seen"));
    await set("tasks/seen3", task("peer", "seen"));
    await set("tasks/mine", task("planner", "seen"));
    await set("tasks/hidden1", task("junior", "hidden"));
  });
});
afterAll(() => env.cleanup());

const as = (id: string) => env.authenticatedContext(id).firestore();

describe("event-scoped task reads", () => {
  it("lists one visible event's tasks", async () => {
    await assertSucceeds(
      getDocs(
        query(
          collection(as("planner"), "tasks"),
          where("eventId", "==", "seen"),
        ),
      ),
    );
  });
  it("refuses to list a hidden event's tasks", async () => {
    await assertFails(
      getDocs(
        query(
          collection(as("planner"), "tasks"),
          where("eventId", "==", "hidden"),
        ),
      ),
    );
  });
  it("refuses one task of a hidden event", async () => {
    await assertFails(getDoc(doc(as("planner"), "tasks/hidden1")));
  });
  it("gets one task of a visible event", async () => {
    await assertSucceeds(getDoc(doc(as("planner"), "tasks/seen1")));
  });
  it("still lists your own tasks", async () => {
    await assertSucceeds(
      getDocs(
        query(
          collection(as("planner"), "tasks"),
          where("memberId", "==", "planner"),
        ),
      ),
    );
  });
  it("refuses a list with no event or person in it", async () => {
    await assertFails(getDocs(collection(as("planner"), "tasks")));
  });
  it("lists by event with an 'in' of several visible events", async () => {
    await assertSucceeds(
      getDocs(
        query(
          collection(as("planner"), "tasks"),
          where("eventId", "in", ["seen"]),
        ),
      ),
    );
  });
});

describe("approving by rank, six lookups in one check", () => {
  it("approves someone below", async () => {
    await assertSucceeds(
      updateDoc(doc(as("planner"), "tasks/seen1"), { approvedBy: "planner" }),
    );
  });
  it("approves a peer at the same rank", async () => {
    await assertSucceeds(
      updateDoc(doc(as("planner"), "tasks/seen3"), { approvedBy: "planner" }),
    );
  });
  it("refuses someone above", async () => {
    await assertFails(
      updateDoc(doc(as("planner"), "tasks/seen2"), { approvedBy: "planner" }),
    );
  });
  it("refuses your own work", async () => {
    await assertFails(
      updateDoc(doc(as("planner"), "tasks/mine"), { approvedBy: "planner" }),
    );
  });
  it("refuses a hidden event's task", async () => {
    await assertFails(
      updateDoc(doc(as("boss"), "tasks/hidden1"), { approvedBy: "boss" }),
    );
  });
});
