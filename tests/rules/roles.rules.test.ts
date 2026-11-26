// File : /TeamSamsara.Workflow/tests/rules/roles.rules.test.ts
// Version : 2.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests the roles document: saving it is a protected change the
// server makes (checked against rank and held permissions there), so the app
// can't write it, not even an Administrator; every member still reads it.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { seed, signedInAs, startRulesTestEnv } from "./rulesTestEnv";

let env: RulesTestEnvironment;

type RoleMap = Record<
  string,
  { name: string; position: number; permissions: string[] }
>;

/** The roles document as the app saves it: the roles plus the grants index. */
function rolesDocument(roles: RoleMap) {
  const grants: Record<string, string[]> = {};
  for (const id of Object.keys(roles).sort()) {
    for (const permission of roles[id].permissions) {
      (grants[permission] ??= []).push(id);
    }
  }
  return { roles, grants };
}

const startingRoles: RoleMap = {
  everyone: { name: "Everyone", position: 0, permissions: ["viewAll"] },
  editor: { name: "Editor", position: 1, permissions: ["editAnyTask"] },
  lead: {
    name: "Lead",
    position: 2,
    permissions: ["manageRoles", "planEvents"],
  },
  admin: { name: "Admin", position: 3, permissions: ["administrator"] },
};

const withRole = (
  id: string,
  permissions: string[],
  roles: RoleMap = startingRoles,
): RoleMap => ({
  ...roles,
  [id]: { name: id, position: roles[id]?.position ?? 1, permissions },
});

function save(userId: string, roles: RoleMap) {
  return setDoc(
    doc(signedInAs(env, userId), "config/roles"),
    rolesDocument(roles),
  );
}

beforeAll(async () => {
  env = await startRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, {
    "config/roles": rolesDocument(startingRoles),
    "members/alex": { status: "active", roleIds: ["admin"] },
    "members/jordan": { status: "active", roleIds: ["lead"] },
    "members/sam": { status: "active", roleIds: ["editor"] },
    "members/chris": { status: "disabled", roleIds: ["admin"] },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("saving roles goes through the server", () => {
  it("refuses role saves written by the app, even from an Administrator", async () => {
    await assertFails(
      save("alex", withRole("reviewer", ["approveTasks", "manageMembers"])),
    );
    await assertFails(
      save("jordan", {
        ...startingRoles,
        editor: { ...startingRoles.editor, name: "Writer", position: 1 },
      }),
    );
  });

  it("still lets every member read the roles", async () => {
    await assertSucceeds(getDoc(doc(signedInAs(env, "sam"), "config/roles")));
  });
});
