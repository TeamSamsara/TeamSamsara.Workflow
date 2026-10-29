// File : /TeamSamsara.Workflow/app/src/features/roles/service/roleChanges.test.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Tests adding, editing, reordering and deleting roles: positions stay
// n…1 with Everyone at 0, Everyone can't be renamed, removed or made
// Administrator, and the saved permission index matches the roles.

import { describe, expect, it } from "vitest";
import { serializeRoles, type RoleRecord } from "@/core/data";
import {
  addRole,
  removeRole,
  renumber,
  reorderRoles,
  tidyPermissions,
  updateRole,
} from "./roleChanges";

const role = (
  id: string,
  position: number,
  permissions: string[] = [],
): RoleRecord => ({
  id,
  name: id,
  color: "#000000",
  description: "",
  position,
  permissions,
});

const roles = [
  role("everyone", 0, ["viewAll"]),
  role("editor", 1, ["editAnyTask"]),
  role("planner", 2, ["planEvents"]),
  role("admin", 3, ["administrator"]),
];

const order = (list: RoleRecord[]) =>
  list.map((item) => `${item.id}:${item.position}`);

const fields = (name: string, permissions: string[] = []) => ({
  name,
  color: "#3E8EF7",
  description: "  ",
  permissions: tidyPermissions(permissions),
});

describe("renumber", () => {
  it("counts down from the top and keeps Everyone at 0", () => {
    expect(order(renumber([roles[3], roles[0], roles[1]]))).toEqual([
      "admin:2",
      "editor:1",
      "everyone:0",
    ]);
  });
});

describe("addRole", () => {
  it("puts a new role just above Everyone, trimmed and tidy", () => {
    const next = addRole(roles, "reviewer", {
      ...fields("  Reviewer "),
      permissions: tidyPermissions([
        "viewAll",
        "approveTasks",
        "viewAll",
        "nope",
      ]),
    });
    expect(order(next)).toEqual([
      "admin:4",
      "planner:3",
      "editor:2",
      "reviewer:1",
      "everyone:0",
    ]);
    const added = next.find((item) => item.id === "reviewer");
    expect(added?.name).toBe("Reviewer");
    expect(added?.description).toBe("");
    expect(added?.permissions).toEqual(["approveTasks", "viewAll"]);
  });
});

describe("updateRole", () => {
  it("changes only the role asked for", () => {
    const next = updateRole(
      roles,
      "editor",
      fields("Writer", ["editAnyTask", "approveTasks"]),
    );
    expect(next.find((item) => item.id === "editor")).toMatchObject({
      name: "Writer",
      color: "#3E8EF7",
      position: 1,
      permissions: ["editAnyTask", "approveTasks"],
    });
    expect(next.find((item) => item.id === "planner")?.name).toBe("planner");
  });

  it("only changes Everyone's permissions, and never to Administrator", () => {
    const next = updateRole(
      roles,
      "everyone",
      fields("Renamed", ["administrator", "doAssignedTasks"]),
    );
    expect(next.find((item) => item.id === "everyone")).toMatchObject({
      name: "everyone",
      position: 0,
      permissions: ["doAssignedTasks"],
    });
  });
});

describe("reorderRoles", () => {
  it("follows the order given, top first", () => {
    expect(order(reorderRoles(roles, ["admin", "editor", "planner"]))).toEqual([
      "admin:3",
      "editor:2",
      "planner:1",
      "everyone:0",
    ]);
  });

  it("keeps Everyone at the bottom even if listed", () => {
    expect(
      order(reorderRoles(roles, ["everyone", "admin", "planner", "editor"])),
    ).toEqual(["admin:3", "planner:2", "editor:1", "everyone:0"]);
  });
});

describe("removeRole", () => {
  it("removes a role and closes the gap", () => {
    expect(order(removeRole(roles, "planner"))).toEqual([
      "admin:2",
      "editor:1",
      "everyone:0",
    ]);
  });

  it("never removes Everyone", () => {
    expect(removeRole(roles, "everyone")).toHaveLength(4);
  });
});

describe("saving", () => {
  it("rebuilds the permission index from the changed roles", () => {
    const next = removeRole(
      addRole(
        roles,
        "reviewer",
        fields("Reviewer", ["approveTasks", "planEvents"]),
      ),
      "planner",
    );
    expect(serializeRoles({ roles: next, grants: {} }).grants).toEqual({
      administrator: ["admin"],
      approveTasks: ["reviewer"],
      editAnyTask: ["editor"],
      planEvents: ["reviewer"],
      viewAll: ["everyone"],
    });
  });
});
