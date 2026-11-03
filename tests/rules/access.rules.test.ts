// File : /TeamSamsara.Workflow/tests/rules/access.rules.test.ts
// Version : 1.1.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Tests who counts as an active member: they (and just-invited members)
// read the workspace settings, the roles and the member list; disabled members,
// accounts with no record and signed-out visitors read none of it.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, signedOut, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

const member = (status: string, roleIds: string[] = []) => ({
  displayName: status,
  email: `${status}@example.test`,
  status,
  roleIds,
  workGroupIds: [],
});

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/workspace": { name: "Test workspace" },
    "config/roles": {
      roles: { everyone: { name: "Everyone", permissions: ["viewAll"] } },
      grants: { viewAll: ["everyone"] },
    },
    "members/active": member("active"),
    "members/invited": member("invited"),
    "members/disabled": member("disabled"),
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("workspace settings and roles", () => {
  it("are readable by active and invited members", async () => {
    for (const who of ["active", "invited"]) {
      const db = signedInAs(env, who);
      await assertSucceeds(getDoc(doc(db, "config/roles")));
      await assertSucceeds(getDoc(doc(db, "config/workspace")));
    }
  });

  it("are not readable by a disabled member", async () => {
    await assertFails(getDoc(doc(signedInAs(env, "disabled"), "config/roles")));
  });

  it("are not readable by an account with no member record", async () => {
    await assertFails(getDoc(doc(signedInAs(env, "stranger"), "config/roles")));
  });

  it("are not readable signed out (except whether a workspace exists)", async () => {
    await assertFails(getDoc(doc(signedOut(env), "config/roles")));
  });

  it("are not writable through these rules", async () => {
    const db = signedInAs(env, "active");
    await assertFails(
      setDoc(doc(db, "config/roles"), { roles: {}, grants: {} }),
    );
    await assertFails(setDoc(doc(db, "config/workspace"), { name: "Mine" }));
  });
});

describe("the member list", () => {
  it("is readable by an active member", async () => {
    await assertSucceeds(
      getDocs(collection(signedInAs(env, "active"), "members")),
    );
    await assertSucceeds(
      getDoc(doc(signedInAs(env, "active"), "members/invited")),
    );
  });

  it("is not readable by a disabled member, who still sees their own record", async () => {
    const db = signedInAs(env, "disabled");
    await assertFails(getDocs(collection(db, "members")));
    await assertSucceeds(getDoc(doc(db, "members/disabled")));
    await assertFails(getDoc(doc(db, "members/active")));
  });

  it("is not readable by an account with no member record", async () => {
    await assertFails(
      getDocs(collection(signedInAs(env, "stranger"), "members")),
    );
  });
});
