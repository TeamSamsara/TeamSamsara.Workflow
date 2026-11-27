// File : /TeamSamsara.Workflow/tests/rules/workflowReviews.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : Tests the list a workflow save writes down for whoever saved it
// against the rules: only they read it; they only add tasks to move or say
// they're leaving them; nobody makes or deletes one from the app.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const review = {
  workflowId: "promo",
  workflowName: "Match day",
  byId: "jordan",
  tasks: [
    {
      taskId: "t1",
      title: "Caption",
      eventId: "e1",
      eventTitle: "Final",
      edited: false,
    },
    {
      taskId: "t2",
      title: "Banner",
      eventId: "e1",
      eventTitle: "Final",
      edited: true,
    },
  ],
  total: 2,
  move: ["t1"],
  moved: ["t1"],
  skipped: [],
  left: false,
  at: new Date(2026, 10, 20),
};

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "members/jordan": { status: "active", roleIds: [] },
    "members/sam": { status: "active", roleIds: [] },
    "workflowReviews/r1": review,
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("the tasks a workflow save differs from", () => {
  const as = (member: string) =>
    doc(signedInAs(env, member), "workflowReviews", "r1");

  it("are read only by whoever saved it", async () => {
    await assertSucceeds(getDoc(as("jordan")));
    await assertFails(getDoc(as("sam")));
  });

  it("can be added to what to move, or left, by whoever saved it", async () => {
    await assertSucceeds(updateDoc(as("jordan"), { move: ["t1", "t2"] }));
    await assertSucceeds(updateDoc(as("jordan"), { left: true }));
  });

  it("can't take back a move, change anything else, or be changed by others", async () => {
    await assertFails(updateDoc(as("jordan"), { move: [] }));
    await assertFails(updateDoc(as("jordan"), { moved: ["t1", "t2"] }));
    await assertFails(updateDoc(as("jordan"), { tasks: [] }));
    await assertFails(updateDoc(as("jordan"), { left: "yes" }));
    await assertFails(updateDoc(as("sam"), { move: ["t1", "t2"] }));
  });

  it("are never made or deleted from the app", async () => {
    await assertFails(
      setDoc(doc(signedInAs(env, "jordan"), "workflowReviews", "r2"), review),
    );
    await assertFails(deleteDoc(as("jordan")));
  });
});
