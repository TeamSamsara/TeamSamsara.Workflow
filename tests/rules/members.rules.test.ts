// File : /TeamSamsara.Workflow/tests/rules/members.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Tests changes to members made by others: invites need Manage
// members; names and access need Manage members; roles also open to Manage
// roles, groups to Manage work groups; nobody gives a permission they don't
// hold (Administrator only from an Administrator); only an Administrator
// touches an Administrator; members are never deleted.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const roles = {
  roles: {
    everyone: { name: "Everyone", position: 0, permissions: ["viewAll"] },
    planner: { name: "Planner", position: 1, permissions: ["planEvents"] },
    helper: { name: "Helper", position: 1, permissions: [] },
    people: {
      name: "People",
      position: 2,
      permissions: ["manageMembers", "planEvents"],
    },
    rolekeeper: {
      name: "Role keeper",
      position: 3,
      permissions: ["manageRoles"],
    },
    grouper: {
      name: "Grouper",
      position: 4,
      permissions: ["manageWorkGroups"],
    },
    settings: {
      name: "Settings",
      position: 5,
      permissions: ["manageSettings"],
    },
    admin: { name: "Admin", position: 6, permissions: ["administrator"] },
  },
  grants: {
    administrator: ["admin"],
    manageMembers: ["people"],
    manageRoles: ["rolekeeper"],
    manageSettings: ["settings"],
    manageWorkGroups: ["grouper"],
    planEvents: ["people", "planner"],
    viewAll: ["everyone"],
  },
};

const record = (status: string, roleIds: string[] = [], extra = {}) => ({
  displayName: "",
  email: "someone@example.test",
  status,
  roleIds,
  workGroupIds: [],
  timeZone: null,
  invitedBy: null,
  invitedAt: null,
  joinedAt: status === "active" ? new Date(2026, 0, 1) : null,
  lastActiveAt: null,
  ...extra,
});

const invite = (by: string, roleIds: string[] = []) => ({
  ...record("invited", roleIds),
  email: "new@example.test",
  invitedBy: by,
  invitedAt: serverTimestamp(),
});

const member = (as: string, id: string) =>
  doc(signedInAs(env, as), "members", id);

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": roles,
    "members/alex": record("active", ["admin"]),
    "members/jordan": record("active", ["people"]),
    "members/riley": record("active", ["rolekeeper"]),
    "members/gwen": record("active", ["grouper"]),
    "members/sam": record("active"),
    "members/mika": record("invited"),
    "members/chris": record("disabled", ["people"]),
    "members/old": record("removed"),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("inviting", () => {
  it("needs Manage members, and must come from the inviter at the server's time", async () => {
    await assertSucceeds(
      setDoc(member("jordan", "new1"), invite("jordan", ["planner"])),
    );
    await assertFails(setDoc(member("sam", "new2"), invite("sam")));
    await assertFails(setDoc(member("chris", "new3"), invite("chris")));
    await assertFails(setDoc(member("jordan", "new4"), invite("alex")));
    await assertFails(
      setDoc(member("jordan", "new5"), {
        ...invite("jordan"),
        status: "active",
      }),
    );
  });

  it("can't give a permission the inviter doesn't hold", async () => {
    await assertFails(
      setDoc(member("jordan", "new6"), invite("jordan", ["settings"])),
    );
    await assertFails(
      setDoc(member("jordan", "new7"), invite("jordan", ["admin"])),
    );
    await assertSucceeds(
      setDoc(member("alex", "new8"), invite("alex", ["admin"])),
    );
  });
});

describe("changing names, roles and groups", () => {
  it("lets Manage members change a name, roles and groups", async () => {
    await assertSucceeds(
      updateDoc(member("jordan", "sam"), {
        displayName: "Sam Rivera",
        roleIds: ["planner"],
        workGroupIds: ["video"],
      }),
    );
  });

  it("opens roles to Manage roles and groups to Manage work groups, nothing more", async () => {
    // Helper grants nothing, so Riley may give it; Planner grants Plan events, which Riley lacks.
    await assertSucceeds(
      updateDoc(member("riley", "sam"), { roleIds: ["helper"] }),
    );
    await assertFails(
      updateDoc(member("riley", "mika"), { roleIds: ["planner"] }),
    );
    await assertFails(
      updateDoc(member("riley", "sam"), { workGroupIds: ["video"] }),
    );
    await assertSucceeds(
      updateDoc(member("gwen", "sam"), { workGroupIds: ["video"] }),
    );
    await assertFails(
      updateDoc(member("gwen", "sam"), { roleIds: [] }),
    );
    await assertFails(updateDoc(member("gwen", "sam"), { displayName: "Sam" }));
  });

  it("refuses members without any of those permissions", async () => {
    await assertFails(
      updateDoc(member("sam", "mika"), { displayName: "Mika" }),
    );
  });

  it("never gives a permission the editor doesn't hold, not even to themselves", async () => {
    await assertFails(
      updateDoc(member("jordan", "sam"), { roleIds: ["settings"] }),
    );
    await assertFails(
      updateDoc(member("jordan", "jordan"), {
        roleIds: ["people", "settings"],
      }),
    );
    await assertFails(
      updateDoc(member("riley", "riley"), { roleIds: ["rolekeeper", "admin"] }),
    );
    await assertSucceeds(
      updateDoc(member("alex", "sam"), { roleIds: ["settings"] }),
    );
  });

  it("leaves an Administrator's record to administrators", async () => {
    await assertFails(
      updateDoc(member("jordan", "alex"), { displayName: "Al" }),
    );
    await assertFails(
      updateDoc(member("jordan", "alex"), { status: "disabled" }),
    );
    await assertSucceeds(
      updateDoc(member("alex", "alex"), { displayName: "Alex" }),
    );
  });

  it("keeps the rest of the record as it is", async () => {
    await assertFails(
      updateDoc(member("jordan", "sam"), { email: "other@example.test" }),
    );
    await assertFails(
      updateDoc(member("jordan", "sam"), { joinedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(member("jordan", "sam"), { displayName: "x".repeat(81) }),
    );
  });
});

describe("access", () => {
  it("turns access off and back on, to Active only for people who joined", async () => {
    await assertSucceeds(
      updateDoc(member("jordan", "sam"), { status: "disabled" }),
    );
    await assertSucceeds(
      updateDoc(member("jordan", "sam"), { status: "active" }),
    );
    await assertSucceeds(
      updateDoc(member("jordan", "mika"), { status: "disabled" }),
    );
    await assertFails(
      updateDoc(member("jordan", "mika"), { status: "active" }),
    );
    await assertSucceeds(
      updateDoc(member("jordan", "mika"), { status: "invited" }),
    );
  });

  it("removes only with no roles or groups left", async () => {
    await assertFails(
      updateDoc(member("jordan", "sam"), {
        status: "removed",
        roleIds: ["planner"],
      }),
    );
    await assertSucceeds(
      updateDoc(member("jordan", "sam"), {
        status: "removed",
        roleIds: [],
        workGroupIds: [],
      }),
    );
  });

  it("brings back a removed member as Invited, from the inviter", async () => {
    await assertSucceeds(
      updateDoc(member("jordan", "old"), {
        status: "invited",
        invitedBy: "jordan",
        invitedAt: serverTimestamp(),
      }),
    );
  });

  it("needs Manage members for any of it", async () => {
    await assertFails(
      updateDoc(member("riley", "sam"), { status: "disabled" }),
    );
  });

  it("never deletes a member", async () => {
    await assertFails(deleteDoc(member("alex", "sam")));
  });
});
