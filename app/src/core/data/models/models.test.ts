// File : /TeamSamsara.Workflow/app/src/core/data/models/models.test.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Tests that the workspace, member and roles records survive a save and
// load unchanged, fill in safe defaults for missing fields, and that the roles
// permission index always matches the roles.

import { describe, expect, it } from "vitest";
import { parseMember, serializeMember, type MemberRecord } from "./memberModel";
import {
  buildPermissionGrants,
  EveryoneRoleId,
  parseRoles,
  serializeRoles,
  type RoleRecord,
} from "./rolesModel";
import {
  fallbackTimeZone,
  parseWorkspace,
  serializeWorkspace,
  type WorkspaceRecord,
} from "./workspaceModel";

describe("workspace record", () => {
  const workspace: WorkspaceRecord = {
    name: "Team Samsara",
    timeZone: "America/Toronto",
    weekStartsOn: "sunday",
    timeFormat: "24h",
    defaultTheme: "dark",
    enabledPlatformIds: ["x", "youtube"],
    createdAt: new Date("2026-10-01T12:00:00Z"),
  };

  it("survives a round trip", () => {
    expect(parseWorkspace("workspace", serializeWorkspace(workspace))).toEqual(
      workspace,
    );
  });

  it("fills in defaults for an empty record", () => {
    expect(parseWorkspace("workspace", {})).toEqual({
      name: "",
      timeZone: fallbackTimeZone,
      weekStartsOn: "monday",
      timeFormat: "12h",
      defaultTheme: "device",
      enabledPlatformIds: [],
      createdAt: null,
    });
  });
});

describe("member record", () => {
  const member: MemberRecord = {
    id: "uid-1",
    displayName: "Sam Rivera",
    email: "sam@example.com",
    status: "active",
    roleIds: ["planner"],
    workGroupIds: ["social"],
    timeZone: null,
    invitedBy: "uid-0",
    invitedAt: new Date("2026-10-02T12:00:00Z"),
    joinedAt: new Date("2026-10-03T12:00:00Z"),
    lastActiveAt: null,
  };

  it("survives a round trip, without storing its id", () => {
    const stored = serializeMember(member);
    expect(stored).not.toHaveProperty("id");
    expect(parseMember("uid-1", stored)).toEqual(member);
  });

  it("treats a record with no valid status as disabled", () => {
    expect(parseMember("uid-2", {}).status).toBe("disabled");
    expect(parseMember("uid-2", { status: "admin" }).status).toBe("disabled");
  });
});

describe("roles record", () => {
  const everyone: RoleRecord = {
    id: EveryoneRoleId,
    name: "Everyone",
    color: "#8A8F94",
    description: "",
    position: 0,
    permissions: ["viewAll", "doAssignedTasks"],
  };
  const planner: RoleRecord = {
    id: "planner",
    name: "Planner",
    color: "#3E8EF7",
    description: "Plans the calendar.",
    position: 2,
    permissions: ["planEvents", "viewAll", "planEvents"],
  };
  const admin: RoleRecord = {
    id: "admin",
    name: "Admin",
    color: "#E5484D",
    description: "",
    position: 3,
    permissions: ["administrator"],
  };

  it("indexes which roles grant each permission", () => {
    expect(buildPermissionGrants([planner, everyone, admin])).toEqual({
      administrator: ["admin"],
      doAssignedTasks: ["everyone"],
      planEvents: ["planner"],
      viewAll: ["everyone", "planner"],
    });
  });

  it("rebuilds the index on save, whatever the record held", () => {
    const stored = serializeRoles({
      roles: [everyone, planner],
      grants: { stale: ["nobody"] },
    });
    expect(stored.grants).toEqual(buildPermissionGrants([everyone, planner]));
  });

  it("loads roles highest first and keeps Everyone at the bottom", () => {
    const stored = serializeRoles({
      roles: [{ ...everyone, position: 9 }, planner, admin],
      grants: {},
    });
    const loaded = parseRoles("roles", stored);
    expect(loaded.roles.map((role) => role.id)).toEqual([
      "admin",
      "planner",
      "everyone",
    ]);
    expect(loaded.roles.at(-1)?.position).toBe(0);
  });

  it("drops duplicate permissions on save", () => {
    const stored = serializeRoles({ roles: [planner], grants: {} });
    expect(parseRoles("roles", stored).roles[0].permissions).toEqual([
      "planEvents",
      "viewAll",
    ]);
  });
});
