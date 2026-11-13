// File : /TeamSamsara.Workflow/functions/src/access/managePlan.test.ts
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests the protected changes: strictly below for people and roles,
// leads always members, the Owner role, stale role saves, and the activity
// each change records.

import { describe, expect, it } from "vitest";
import {
  actorOf,
  defaultAssign,
  OwnerRank,
  OwnerRoleId,
} from "../../../engine/src/index.js";
import {
  planManage,
  type GroupEntry,
  type ManageState,
  type MemberEntry,
  type RoleEntry,
} from "./managePlan.js";

const roleEntry = (
  id: string,
  position: number,
  permissions: string[],
): RoleEntry => ({
  id,
  name: id,
  color: "",
  description: "",
  position,
  permissions,
});

const roles: RoleEntry[] = [
  roleEntry("everyone", 0, ["doAssignedTasks"]),
  roleEntry("contributor", 10, ["doAssignedTasks"]),
  roleEntry("planner", 20, ["planEvents"]),
  roleEntry("manager", 30, [
    "manageMembers",
    "manageRoles",
    "manageWorkGroups",
    "planEvents",
  ]),
  roleEntry("admin", 40, ["administrator"]),
  roleEntry(OwnerRoleId, OwnerRank, ["administrator"]),
];

const member = (
  id: string,
  roleIds: string[],
  workGroupIds: string[] = [],
): MemberEntry => ({
  id,
  status: "active",
  displayName: id,
  email: `${id}@example.com`,
  roleIds,
  workGroupIds,
  joinedAt: new Date("2026-01-01"),
});

const people = [
  member("owner", [OwnerRoleId]),
  member("owner2", [OwnerRoleId]),
  member("admin", ["admin"]),
  member("manager", ["manager"]),
  member("lena", ["contributor"], ["design"]),
  member("dev", ["contributor"]),
  member("pia", ["planner"], ["design"]),
  member("sol", ["contributor"], ["design"]),
];
const groups: GroupEntry[] = [
  {
    id: "design",
    name: "Design",
    leadIds: ["lena"],
    assign: { ...defaultAssign, skip: ["lena"] },
  },
];

function state(overrides: Partial<ManageState> = {}): ManageState {
  return {
    roles,
    rolesVersion: 3,
    members: new Map(people.map((entry) => [entry.id, entry])),
    groups: new Map(groups.map((entry) => [entry.id, entry])),
    ...overrides,
  };
}

const actor = (id: string) => {
  const found = people.find((entry) => entry.id === id);
  if (!found) throw new Error(id);
  const leads = groups
    .filter((group) => group.leadIds.includes(id))
    .map((group) => group.id);
  return actorOf(found, roles, leads);
};

describe("people: strictly below", () => {
  it("lets a manager rename a contributor, and records it", () => {
    const result = planManage(actor("manager"), state(), {
      op: "member.update",
      memberId: "dev",
      displayName: "Dev R.",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.members.dev).toEqual({ displayName: "Dev R." });
    expect(result.plan.activity[0]).toMatchObject({
      area: "people",
      action: "renamed",
    });
  });

  it("refuses a manager turning off an Administrator", () => {
    const result = planManage(actor("manager"), state(), {
      op: "member.access",
      memberId: "admin",
      on: false,
    });
    expect(result).toEqual({ ok: false, reason: "notBelow" });
  });

  it("refuses anyone turning off their own access", () => {
    const result = planManage(actor("manager"), state(), {
      op: "member.access",
      memberId: "manager",
      on: false,
    });
    expect(result).toEqual({ ok: false, reason: "notBelow" });
  });

  it("refuses giving a role at your own rank", () => {
    const result = planManage(actor("manager"), state(), {
      op: "member.update",
      memberId: "dev",
      roleIds: ["contributor", "manager"],
    });
    expect(result).toEqual({ ok: false, reason: "notBelow" });
  });

  it("refuses the Owner role through roles", () => {
    const result = planManage(actor("owner"), state(), {
      op: "member.update",
      memberId: "dev",
      roleIds: [OwnerRoleId],
    });
    expect(result).toEqual({ ok: false, reason: "protectedRole" });
  });

  it("removing someone takes them out as a lead too", () => {
    const result = planManage(actor("manager"), state(), {
      op: "member.remove",
      memberId: "lena",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.members.lena).toEqual({
      status: "removed",
      roleIds: [],
      workGroupIds: [],
    });
    expect(result.plan.groups.design).toEqual({ leadIds: [] });
  });

  it("refuses an invite with a role at the inviter's rank", () => {
    const result = planManage(actor("manager"), state(), {
      op: "member.invite",
      email: "new@example.com",
      roleIds: ["manager"],
      workGroupIds: [],
    });
    expect(result).toEqual({ ok: false, reason: "notBelow" });
  });
});

describe("roles", () => {
  it("refuses a save based on an older version", () => {
    const result = planManage(actor("admin"), state(), {
      op: "roles.save",
      roles: roles.filter((role) => role.id !== OwnerRoleId),
      version: 2,
    });
    expect(result).toEqual({ ok: false, reason: "stale" });
  });

  it("refuses a manager moving a role up to their own rank", () => {
    const moved = roles
      .filter((role) => role.id !== OwnerRoleId)
      .map((role) =>
        role.id === "planner" ? { ...role, position: 35 } : role,
      );
    const result = planManage(actor("manager"), state(), {
      op: "roles.save",
      roles: moved,
      version: 3,
    });
    expect(result).toEqual({ ok: false, reason: "notBelow" });
  });

  it("lets an Administrator rename a role below them, and keeps the Owner role", () => {
    const renamed = roles
      .filter((role) => role.id !== OwnerRoleId)
      .map((role) =>
        role.id === "planner" ? { ...role, name: "Organiser" } : role,
      );
    const result = planManage(actor("admin"), state(), {
      op: "roles.save",
      roles: renamed,
      version: 3,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.roles?.some((role) => role.id === OwnerRoleId)).toBe(
      true,
    );
    expect(result.plan.activity).toHaveLength(1);
  });

  it("refuses two roles at the same position", () => {
    const clash = roles
      .filter((role) => role.id !== OwnerRoleId)
      .map((role) =>
        role.id === "contributor" ? { ...role, position: 20 } : role,
      );
    const result = planManage(actor("admin"), state(), {
      op: "roles.save",
      roles: clash,
      version: 3,
    });
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("leads and Owners", () => {
  it("making someone a lead puts them in the group", () => {
    const result = planManage(actor("manager"), state(), {
      op: "group.leads",
      groupId: "design",
      leadIds: ["lena", "dev"],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.members.dev).toEqual({ workGroupIds: ["design"] });
  });

  it("only an Owner makes someone an Owner", () => {
    expect(
      planManage(actor("admin"), state(), {
        op: "owner.give",
        memberId: "dev",
      }),
    ).toEqual({ ok: false, reason: "ownerOnly" });
    expect(
      planManage(actor("owner"), state(), { op: "owner.give", memberId: "dev" })
        .ok,
    ).toBe(true);
  });

  it("the last Owner can't step down", () => {
    const alone = state({
      members: new Map(
        people
          .filter((entry) => entry.id !== "owner2")
          .map((entry) => [entry.id, entry]),
      ),
    });
    expect(planManage(actor("owner"), alone, { op: "owner.stepDown" })).toEqual(
      {
        ok: false,
        reason: "lastOwner",
      },
    );
    expect(
      planManage(actor("owner"), state(), { op: "owner.stepDown" }).ok,
    ).toBe(true);
  });
});

describe("a group's hand-out", () => {
  it("lets a manager turn it on and set the limit, and records it", () => {
    const result = planManage(actor("manager"), state(), {
      op: "group.assign",
      groupId: "design",
      on: true,
      dailyLimit: 5,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.groups.design).toEqual({
      assign: { on: true, dailyLimit: 5, headsUpHours: 24, skip: ["lena"] },
    });
    expect(result.plan.activity[0].summary).toBe(
      "Turned on handing out tasks for Design",
    );
  });

  it("keeps the limit and heads-up within their choices", () => {
    for (const change of [
      { dailyLimit: 1 },
      { dailyLimit: 11 },
      { headsUpHours: 6 },
    ])
      expect(
        planManage(actor("manager"), state(), {
          op: "group.assign",
          groupId: "design",
          ...change,
        }),
      ).toEqual({ ok: false, reason: "invalid" });
  });

  it("lets a lead choose who takes tasks, but not the settings", () => {
    const takers = planManage(actor("lena"), state(), {
      op: "group.assign",
      groupId: "design",
      skip: ["sol"],
    });
    expect(takers.ok).toBe(true);
    const settings = planManage(actor("lena"), state(), {
      op: "group.assign",
      groupId: "design",
      on: true,
    });
    expect(settings).toEqual({ ok: false, reason: "missingPermission" });
  });

  it("refuses a lead choosing for someone above them, or outside the group", () => {
    expect(
      planManage(actor("lena"), state(), {
        op: "group.assign",
        groupId: "design",
        skip: ["lena", "pia"],
      }),
    ).toEqual({ ok: false, reason: "outranked" });
    expect(
      planManage(actor("lena"), state(), {
        op: "group.assign",
        groupId: "design",
        skip: ["lena", "dev"],
      }),
    ).toEqual({ ok: false, reason: "invalid" });
  });
});
