// File : /TeamSamsara.Workflow/app/src/features/roles/service/roleAccess.test.ts
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Tests what a member may do on the role screens: switches limited to
// their own permissions, Administrator kept for administrators, deleting
// blocked for Everyone, higher roles, the last admin role and stronger roles.

import { describe, expect, it } from "vitest";
import { resolvePermissions } from "@/core/access";
import {
  buildPermissionGrants,
  type RoleRecord,
  type RolesRecord,
} from "@/core/data";
import {
  canChangePermission,
  deleteBlocker,
  firstMovableIndex,
  givableRoles,
  isLastAdministratorRole,
  type RoleEditor,
} from "./roleAccess";

const role = (
  id: string,
  position: number,
  permissions: string[] = [],
): RoleRecord => ({
  id,
  name: id,
  color: "",
  description: "",
  position,
  permissions,
});

const admin = role("admin", 4, ["administrator"]);
const lead = role("lead", 3, ["manageRoles", "planEvents"]);
const planner = role("planner", 2, ["planEvents"]);
const reviewer = role("reviewer", 1, ["approveTasks"]);
const everyone = role("everyone", 0, ["viewAll"]);
const list = [admin, lead, planner, reviewer, everyone];
const roles: RolesRecord = { roles: list, grants: buildPermissionGrants(list) };

const editorWith = (roleIds: string[]): RoleEditor => ({
  memberRoleIds: roleIds,
  permissions: resolvePermissions(roleIds, roles),
});

const leadEditor = editorWith(["lead"]);
const adminEditor = editorWith(["admin"]);

describe("canChangePermission", () => {
  it("allows only permissions the member holds", () => {
    expect(canChangePermission("planEvents", leadEditor)).toBe(true);
    expect(canChangePermission("viewAll", leadEditor)).toBe(true);
    expect(canChangePermission("approveTasks", leadEditor)).toBe(false);
  });

  it("keeps Administrator for administrators", () => {
    expect(canChangePermission("administrator", leadEditor)).toBe(false);
    expect(canChangePermission("administrator", adminEditor)).toBe(true);
    expect(canChangePermission("approveTasks", adminEditor)).toBe(true);
  });
});

describe("deleteBlocker", () => {
  it("never deletes Everyone", () => {
    expect(deleteBlocker(everyone, roles, adminEditor)).toBe("everyone");
  });

  it("blocks roles at or above the member's own", () => {
    expect(deleteBlocker(lead, roles, leadEditor)).toBe("notManaged");
    expect(deleteBlocker(admin, roles, leadEditor)).toBe("notManaged");
  });

  it("blocks a role with permissions the member doesn't hold", () => {
    expect(deleteBlocker(reviewer, roles, leadEditor)).toBe("permissions");
    expect(deleteBlocker(planner, roles, leadEditor)).toBeNull();
  });

  it("keeps the last Administrator role", () => {
    expect(isLastAdministratorRole("admin", roles)).toBe(true);
    expect(deleteBlocker(admin, roles, adminEditor)).toBe("lastAdmin");
  });
});

describe("firstMovableIndex", () => {
  const ordered = [admin, lead, planner, reviewer];

  it("starts below the member's highest role", () => {
    expect(firstMovableIndex(ordered, roles, leadEditor)).toBe(2);
  });

  it("lets an administrator move every role", () => {
    expect(firstMovableIndex(ordered, roles, adminEditor)).toBe(0);
  });

  it("locks the whole list for someone with no role above another", () => {
    expect(firstMovableIndex(ordered, roles, editorWith([]))).toBe(4);
  });
});

describe("givableRoles", () => {
  const ids = (list: RoleRecord[]) => list.map((item) => item.id);

  it("offers roles below the member, with only permissions they hold", () => {
    expect(ids(givableRoles(roles, leadEditor))).toEqual(["planner"]);
  });

  it("offers an administrator every role but Everyone", () => {
    expect(ids(givableRoles(roles, adminEditor))).toEqual([
      "admin",
      "lead",
      "planner",
      "reviewer",
    ]);
  });
});
