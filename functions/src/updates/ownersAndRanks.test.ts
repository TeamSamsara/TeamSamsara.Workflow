// File : /TeamSamsara.Workflow/functions/src/updates/ownersAndRanks.test.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Tests the update that brings a workspace onto the permission model:
// who becomes the Owner, roles at distinct positions in the same order, ranks,
// leads inside their groups as overseers, open tasks handed back, and that a
// second run changes nothing.

import { describe, expect, it } from "vitest";
import { OwnerRank, OwnerRoleId } from "../../../engine/src/index.js";
import type { RoleEntry } from "../access/managePlan.js";
import {
  ownerRole,
  planOwnersAndRanks,
  type GroupForUpdate,
  type MemberForUpdate,
} from "./ownersAndRanks.js";

const role = (
  id: string,
  position: number,
  permissions: string[] = [],
): RoleEntry => ({
  id,
  name: id,
  color: "",
  description: "",
  position,
  permissions,
});

const person = (
  id: string,
  change: Partial<MemberForUpdate> = {},
): MemberForUpdate => ({
  id,
  name: id,
  status: "active",
  roleIds: [],
  workGroupIds: [],
  invitedBy: "founder",
  joinedAt: 100,
  rank: null,
  leadOf: null,
  ...change,
});

const roles = [
  role("everyone", 0),
  role("admin", 3, ["administrator"]),
  role("planner", 2, ["planEvents"]),
  role("crew", 2),
];

const founder = person("founder", {
  roleIds: ["admin"],
  invitedBy: null,
  joinedAt: 1,
});
const otherAdmin = person("sam", { roleIds: ["admin"], joinedAt: 0 });

describe("the Owner", () => {
  it("goes to whoever set up the workspace, not the earliest admin", () => {
    const plan = planOwnersAndRanks(roles, [otherAdmin, founder], [], []);
    expect(plan.ownerId).toBe("founder");
    expect(plan.members.founder.roleIds).toEqual(["admin", OwnerRoleId]);
    expect(plan.members.founder.rank).toBe(OwnerRank);
    expect(plan.roles?.some((entry) => entry.id === OwnerRoleId)).toBe(true);
  });

  it("falls back to the earliest active admin", () => {
    const off = person("founder", {
      roleIds: ["admin"],
      invitedBy: null,
      status: "disabled",
    });
    const plan = planOwnersAndRanks(roles, [off, otherAdmin], [], []);
    expect(plan.ownerId).toBe("sam");
  });

  it("isn't given again when someone already holds it", () => {
    const owner = person("founder", { roleIds: ["admin", OwnerRoleId] });
    const plan = planOwnersAndRanks(
      [...roles, ownerRole],
      [owner, otherAdmin],
      [],
      [],
    );
    expect(plan.ownerId).toBeNull();
  });
});

describe("role positions", () => {
  it("become distinct, keeping the order people saw", () => {
    const plan = planOwnersAndRanks(roles, [founder], [], []);
    const position = (id: string) =>
      plan.roles?.find((entry) => entry.id === id)?.position;
    expect(position("admin")).toBe(3);
    // planner and crew shared 2; by name, crew was shown first.
    expect(position("crew")).toBe(2);
    expect(position("planner")).toBe(1);
    expect(position("everyone")).toBe(0);
    expect(position(OwnerRoleId)).toBe(OwnerRank);
  });

  it("are left alone when already distinct", () => {
    const fine = [
      role("everyone", 0),
      role("admin", 2, ["administrator"]),
      role("crew", 1),
      ownerRole,
    ];
    const owner = person("founder", {
      roleIds: [OwnerRoleId],
      rank: OwnerRank,
      leadOf: [],
    });
    expect(planOwnersAndRanks(fine, [owner], [], []).roles).toBeNull();
  });
});

describe("leads", () => {
  const group: GroupForUpdate = {
    id: "design",
    leadIds: ["lee", "gone"],
    skip: null,
  };
  const lee = person("lee", { roleIds: ["crew"] });
  const gone = person("gone", { status: "removed", workGroupIds: ["design"] });

  it("join their group and start as overseers; removed people lead nothing", () => {
    const plan = planOwnersAndRanks(roles, [founder, lee, gone], [group], []);
    expect(plan.members.lee.workGroupIds).toEqual(["design"]);
    expect(plan.members.lee.leadOf).toEqual(["design"]);
    expect(plan.members.gone.leadOf).toEqual([]);
    expect(plan.groups.design).toEqual({
      leadIds: ["lee"],
      assign: { on: false, dailyLimit: 3, headsUpHours: 24, skip: ["lee"] },
    });
  });

  it("keep the group's assignment settings when it already has them", () => {
    const set = { ...group, leadIds: ["lee"], skip: [] };
    const plan = planOwnersAndRanks(roles, [founder, lee], [set], []);
    expect(plan.groups.design).toBeUndefined();
  });
});

describe("open tasks", () => {
  it("come back from people turned off or removed, unless waiting for review", () => {
    const off = person("off", { status: "disabled" });
    const plan = planOwnersAndRanks(
      roles,
      [founder, off],
      [],
      [
        { id: "t1", memberId: "off", inReview: false },
        { id: "t2", memberId: "off", inReview: true },
        { id: "t3", memberId: "founder", inReview: false },
      ],
    );
    expect(plan.tasks).toEqual(["t1"]);
  });
});

describe("a second run", () => {
  it("changes nothing", () => {
    const lee = person("lee", { roleIds: ["crew"] });
    const groups: GroupForUpdate[] = [
      { id: "design", leadIds: ["lee"], skip: null },
    ];
    const first = planOwnersAndRanks(roles, [founder, lee], groups, []);

    const after = (member: MemberForUpdate): MemberForUpdate => ({
      ...member,
      ...(first.members[member.id] as Partial<MemberForUpdate>),
    });
    const again = planOwnersAndRanks(
      first.roles ?? roles,
      [after(founder), after(lee)],
      [{ id: "design", leadIds: ["lee"], skip: ["lee"] }],
      [],
    );
    expect(again.roles).toBeNull();
    expect(again.ownerId).toBeNull();
    expect(again.members).toEqual({});
    expect(again.groups).toEqual({});
  });
});
