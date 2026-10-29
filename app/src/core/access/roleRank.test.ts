// File : /TeamSamsara.Workflow/app/src/core/access/roleRank.test.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Tests that members manage only the roles below their highest one,
// that Administrators manage all, and that Everyone is never handed out.

import { describe, expect, it } from "vitest";
import type { RoleRecord, RolesRecord } from "@/core/data";
import { assignableRoles, canManageRole, highestPosition } from "./roleRank";

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
const lead = role("lead", 3, ["manageRoles"]);
const planner = role("planner", 2);
const editor = role("editor", 1);
const everyone = role("everyone", 0);
const roles: RolesRecord = {
  roles: [admin, lead, planner, editor, everyone],
  grants: {},
};

describe("role order", () => {
  it("finds the highest held role", () => {
    expect(highestPosition(["editor", "lead"], roles)).toBe(3);
    expect(highestPosition([], roles)).toBe(0);
  });

  it("lets a member manage only roles below their highest", () => {
    expect(canManageRole(["lead"], planner, roles)).toBe(true);
    expect(canManageRole(["lead"], lead, roles)).toBe(false);
    expect(canManageRole(["lead"], admin, roles)).toBe(false);
  });

  it("lets an Administrator manage every role", () => {
    expect(canManageRole(["admin"], admin, roles)).toBe(true);
  });

  it("never hands out Everyone", () => {
    expect(assignableRoles(["lead"], roles).map((r) => r.id)).toEqual([
      "planner",
      "editor",
    ]);
    expect(assignableRoles(["admin"], roles).map((r) => r.id)).toEqual([
      "admin",
      "lead",
      "planner",
      "editor",
    ]);
  });
});
