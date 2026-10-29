// File : /TeamSamsara.Workflow/tests/rules/membersSelf.rules.test.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Tests what a member may do with their own record: read it, become
// active on their first sign-in, and note when they were last active. Nothing
// else, and never on someone else's record.

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
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const baseMember = {
  displayName: "",
  email: "",
  roleIds: [],
  workGroupIds: [],
  timeZone: null,
  invitedBy: null,
  invitedAt: null,
  joinedAt: null,
  lastActiveAt: null,
};

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "members/sam": {
      ...baseMember,
      email: "sam@example.com",
      status: "active",
    },
    "members/mika": {
      ...baseMember,
      email: "mika@example.com",
      status: "invited",
    },
    "members/chris": {
      ...baseMember,
      email: "chris@example.com",
      status: "disabled",
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

const memberDoc = (asUser: string, memberId: string) =>
  doc(signedInAs(env, asUser), "members", memberId);

describe("reading member records", () => {
  it("lets a member read their own record", async () => {
    await assertSucceeds(getDoc(memberDoc("sam", "sam")));
  });

  it("lets an account read its own missing record (to learn it has no access)", async () => {
    await assertSucceeds(getDoc(memberDoc("stranger", "stranger")));
  });

  it("does not let a member read someone else's record", async () => {
    await assertFails(getDoc(memberDoc("sam", "mika")));
  });

  it("does not let anyone signed out read a record", async () => {
    await assertFails(getDoc(doc(signedOut(env), "members", "sam")));
  });
});

describe("activating on first sign-in", () => {
  it("lets an invited member become active with the server's time", async () => {
    await assertSucceeds(
      updateDoc(memberDoc("mika", "mika"), {
        status: "active",
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      }),
    );
  });

  it("refuses activation that also changes roles", async () => {
    await assertFails(
      updateDoc(memberDoc("mika", "mika"), {
        status: "active",
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        roleIds: ["admin"],
      }),
    );
  });

  it("refuses activation with a made-up time", async () => {
    await assertFails(
      updateDoc(memberDoc("mika", "mika"), {
        status: "active",
        joinedAt: new Date("2020-01-01"),
        lastActiveAt: serverTimestamp(),
      }),
    );
  });

  it("does not let a disabled member turn themselves back on", async () => {
    await assertFails(
      updateDoc(memberDoc("chris", "chris"), {
        status: "active",
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      }),
    );
  });

  it("does not let a member activate someone else", async () => {
    await assertFails(
      updateDoc(memberDoc("sam", "mika"), {
        status: "active",
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      }),
    );
  });
});

describe("recording last activity", () => {
  it("lets an active member record when they were last active", async () => {
    await assertSucceeds(
      updateDoc(memberDoc("sam", "sam"), { lastActiveAt: serverTimestamp() }),
    );
  });

  it("refuses it for a disabled member", async () => {
    await assertFails(
      updateDoc(memberDoc("chris", "chris"), {
        lastActiveAt: serverTimestamp(),
      }),
    );
  });

  it("refuses changing anything else along with it", async () => {
    await assertFails(
      updateDoc(memberDoc("sam", "sam"), {
        lastActiveAt: serverTimestamp(),
        displayName: "Boss",
      }),
    );
  });
});

describe("other writes", () => {
  it("does not let anyone create their own record", async () => {
    await assertFails(
      setDoc(memberDoc("stranger", "stranger"), {
        ...baseMember,
        status: "active",
      }),
    );
  });

  it("does not let a member delete their record", async () => {
    await assertFails(deleteDoc(memberDoc("sam", "sam")));
  });
});
