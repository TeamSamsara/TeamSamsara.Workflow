// File : /TeamSamsara.Workflow/tests/rules/roles.rules.test.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Tests saving the roles document: only Manage roles may, only
// permissions the editor holds may be handed out or taken away, only an
// Administrator touches Administrator, and the document keeps its shape.

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
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

describe("who may save roles", () => {
  it("lets an Administrator change anything", async () => {
    await assertSucceeds(
      save("alex", withRole("reviewer", ["approveTasks", "manageMembers"])),
    );
  });

  it("lets Manage roles reorder and rename", async () => {
    await assertSucceeds(
      save("jordan", {
        ...startingRoles,
        editor: { ...startingRoles.editor, name: "Writer", position: 1 },
      }),
    );
  });

  it("refuses members without Manage roles, and disabled members", async () => {
    await assertFails(
      save("sam", withRole("editor", ["editAnyTask", "viewAll"])),
    );
    await assertFails(save("chris", withRole("reviewer", ["approveTasks"])));
  });
});

describe("handing out permissions", () => {
  it("allows permissions the editor holds", async () => {
    await assertSucceeds(
      save("jordan", withRole("planner", ["planEvents", "viewAll"])),
    );
  });

  it("refuses permissions the editor doesn't hold", async () => {
    await assertFails(save("jordan", withRole("planner", ["approveTasks"])));
    await assertFails(
      save(
        "jordan",
        withRole("lead", ["manageRoles", "planEvents", "manageSettings"]),
      ),
    );
  });

  it("refuses taking away permissions the editor doesn't hold", async () => {
    await assertFails(save("jordan", withRole("editor", [])));
  });

  it("keeps Administrator for administrators", async () => {
    await assertFails(save("jordan", withRole("planner", ["administrator"])));
    await assertSucceeds(save("alex", withRole("planner", ["administrator"])));
  });
});

describe("the shape of the document", () => {
  it("keeps Everyone, and never makes it Administrator", async () => {
    const { everyone: _removed, ...withoutEveryone } = startingRoles;
    await assertFails(save("alex", withoutEveryone));
    await assertFails(
      save("alex", withRole("everyone", ["viewAll", "administrator"])),
    );
  });

  it("always leaves someone with Administrator", async () => {
    await assertFails(save("alex", withRole("admin", ["manageRoles"])));
  });

  it("refuses unknown permissions in the index", async () => {
    await assertFails(
      save("alex", withRole("editor", ["editAnyTask", "launchRockets"])),
    );
  });

  it("can't be deleted", async () => {
    await assertFails(deleteDoc(doc(signedInAs(env, "alex"), "config/roles")));
  });
});
