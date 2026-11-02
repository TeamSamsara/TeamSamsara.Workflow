// File : /TeamSamsara.Workflow/tests/rules/attendance.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Tests replies against the rules: people in an event that asks
// reply for themselves only (Going, Maybe or Can't go, a short note, the
// server's time), nobody else changes anything that way, and planners save
// who's required.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const event = (changes: Record<string, unknown> = {}) => ({
  title: "vs. Kitsune",
  eventTypeId: null,
  startsAt: new Date(2026, 10, 14, 19),
  endsAt: new Date(2026, 10, 14, 21),
  link: null,
  details: {},
  workflowIds: [],
  notes: "",
  repeatId: null,
  everyone: false,
  groupIds: ["bloom"],
  memberIds: ["rio"],
  asksReply: true,
  requiredIds: ["mika"],
  tellEveryReply: false,
  createdBy: "pat",
  createdAt: new Date(2026, 10, 1),
  updatedAt: new Date(2026, 10, 1),
  ...changes,
});

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": {
      roles: {
        everyone: { name: "Everyone", position: 0, permissions: [] },
        planner: { name: "Planner", position: 1, permissions: ["planEvents"] },
      },
      grants: { planEvents: ["planner"] },
    },
    "members/pat": { status: "active", roleIds: ["planner"], workGroupIds: [] },
    "members/mika": { status: "active", roleIds: [], workGroupIds: ["bloom"] },
    "members/rio": { status: "active", roleIds: [], workGroupIds: [] },
    "members/kai": { status: "active", roleIds: [], workGroupIds: ["staff"] },
    "events/match": event(),
    "events/quiet": event({ asksReply: false }),
  });
});

afterAll(async () => {
  await env.cleanup();
});

const reply = (answer: string, note = "") => ({
  answer,
  note,
  at: serverTimestamp(),
});

describe("replying", () => {
  const match = (who: string) => doc(signedInAs(env, who), "events/match");

  it("lets people in the event reply for themselves", async () => {
    await assertSucceeds(
      updateDoc(match("mika"), { "replies.mika": reply("going") }),
    );
    await assertSucceeds(
      updateDoc(match("rio"), { "replies.rio": reply("cant", "Away") }),
    );
    // And change it later.
    await assertSucceeds(
      updateDoc(match("mika"), { "replies.mika": reply("maybe") }),
    );
  });

  it("refuses replies for someone else or from outside the event", async () => {
    await assertFails(
      updateDoc(match("mika"), { "replies.rio": reply("going") }),
    );
    await assertFails(
      updateDoc(match("kai"), { "replies.kai": reply("going") }),
    );
  });

  it("refuses replies to events that don't ask", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "mika"), "events/quiet"), {
        "replies.mika": reply("going"),
      }),
    );
  });

  it("refuses odd answers, long notes, made-up times and other changes", async () => {
    await assertFails(
      updateDoc(match("mika"), { "replies.mika": reply("yes") }),
    );
    await assertFails(
      updateDoc(match("mika"), {
        "replies.mika": reply("cant", "x".repeat(301)),
      }),
    );
    await assertFails(
      updateDoc(match("mika"), {
        "replies.mika": { answer: "going", note: "", at: new Date() },
      }),
    );
    await assertFails(
      updateDoc(match("mika"), {
        "replies.mika": reply("going"),
        title: "Renamed",
      }),
    );
  });
});

describe("planning attendance", () => {
  it("lets planners save who's required and ask for replies", async () => {
    await assertSucceeds(
      setDoc(doc(signedInAs(env, "pat"), "events/new"), {
        ...event({ requiredIds: ["mika", "rio"], tellEveryReply: true }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(signedInAs(env, "pat"), "events/odd"), {
        ...event({ asksReply: "yes" }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("doesn't let people who can't plan change attendance", async () => {
    await assertFails(
      updateDoc(doc(signedInAs(env, "mika"), "events/match"), {
        requiredIds: [],
      }),
    );
  });
});
