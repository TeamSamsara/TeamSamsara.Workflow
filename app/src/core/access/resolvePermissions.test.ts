// File : /TeamSamsara.Workflow/app/src/core/access/resolvePermissions.test.ts
// Version : 1.1.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Tests that permissions add up from Everyone and held roles, and that
// Administrator grants everything.

import { describe, expect, it } from "vitest";
import {
  buildPermissionGrants,
  type RoleRecord,
  type RolesRecord,
} from "@/core/data";
import { PermissionKeys } from "./permissionKeys";
import { heldRoleIds, resolvePermissions } from "./resolvePermissions";

const role = (
  id: string,
  position: number,
  permissions: string[],
): RoleRecord => ({
  id,
  name: id,
  color: "",
  description: "",
  position,
  permissions,
});

const roleList = [
  role("admin", 3, ["administrator"]),
  role("planner", 2, ["planEvents", "editWorkflows"]),
  role("reviewer", 1, ["approveTasks", "notARealPermission"]),
  role("everyone", 0, ["viewAll", "doAssignedTasks"]),
];

const roles: RolesRecord = {
  roles: roleList,
  grants: buildPermissionGrants(roleList),
};

describe("resolvePermissions", () => {
  it("gives everyone the Everyone role's permissions", () => {
    expect([...resolvePermissions([], roles)].sort()).toEqual([
      "doAssignedTasks",
      "viewAll",
    ]);
  });

  it("adds up every held role", () => {
    const permissions = resolvePermissions(["planner", "reviewer"], roles);
    expect(permissions.has("planEvents")).toBe(true);
    expect(permissions.has("approveTasks")).toBe(true);
    expect(permissions.has("viewAll")).toBe(true);
    expect(permissions.has("manageMembers")).toBe(false);
  });

  it("ignores permissions the app doesn't know", () => {
    expect(resolvePermissions(["reviewer"], roles).size).toBe(3);
  });

  it("gives an Administrator every permission", () => {
    expect(resolvePermissions(["admin"], roles).size).toBe(
      PermissionKeys.length,
    );
  });

  it("follows the grants index, like the security rules, if the two ever disagree", () => {
    const tampered: RolesRecord = {
      roles: [role("planner", 2, ["administrator"]), role("everyone", 0, [])],
      grants: { planEvents: ["planner"] },
    };
    expect([...resolvePermissions(["planner"], tampered)]).toEqual([
      "planEvents",
    ]);
  });

  it("ignores roles that no longer exist", () => {
    expect(heldRoleIds(["deleted", "planner"], roles)).toEqual(
      new Set(["everyone", "planner"]),
    );
  });
});
