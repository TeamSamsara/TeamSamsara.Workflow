// File : /TeamSamsara.Workflow/tests/rules/members.rules.test.ts
// Version : 2.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests changes to members made by others: inviting, names, roles,
// groups and access are protected changes the server makes (checked against
// rank there), so the app can't write them, not even an Administrator. Rank
// and leads are the server's too. Members are never deleted.

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

describe("protected changes go through the server", () => {
  it("refuses invites written by the app, even from an Administrator", async () => {
    await assertFails(
      setDoc(member("jordan", "new1"), invite("jordan", ["planner"])),
    );
    await assertFails(setDoc(member("alex", "new8"), invite("alex", ["admin"])));
  });

  it("refuses names, roles, groups and access written by the app", async () => {
    await assertFails(
      updateDoc(member("jordan", "sam"), { displayName: "Sam Rivera" }),
    );
    await assertFails(
      updateDoc(member("alex", "sam"), { roleIds: ["settings"] }),
    );
    await assertFails(
      updateDoc(member("gwen", "sam"), { workGroupIds: ["video"] }),
    );
    await assertFails(
      updateDoc(member("jordan", "sam"), { status: "disabled" }),
    );
    await assertFails(
      updateDoc(member("jordan", "sam"), {
        status: "removed",
        roleIds: [],
        workGroupIds: [],
      }),
    );
  });

  it("never lets anyone write their own rank or leads", async () => {
    await assertFails(updateDoc(member("sam", "sam"), { rank: 99 }));
    await assertFails(updateDoc(member("sam", "sam"), { leadOf: ["video"] }));
  });

  it("never deletes a member", async () => {
    await assertFails(deleteDoc(member("alex", "sam")));
  });
});
