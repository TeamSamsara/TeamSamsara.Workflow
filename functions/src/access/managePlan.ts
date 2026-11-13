// File : /TeamSamsara.Workflow/functions/src/access/managePlan.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The protected changes, worked out before anything is written:
// a member's name, roles, groups and access, removing or inviting someone,
// saving the roles, setting a group's leads, and giving or giving up the
// Owner role. Each is checked with the shared decide(), against ranks read
// fresh from the roles (never a stored copy), and comes back as the writes
// to make and the activity to record, or the reason it's refused.

import {
  decide,
  OwnerRank,
  OwnerRoleId,
  rankOf,
  type AccessRequest,
  type Actor,
  type DenyReason,
  type MemberStatus,
  type RoleForAccess,
} from "../../../engine/src/index.js";

export interface RoleEntry extends RoleForAccess {
  name: string;
  color: string;
  description: string;
  permissions: string[];
}

export interface MemberEntry {
  id: string;
  status: MemberStatus;
  displayName: string;
  email: string;
  roleIds: string[];
  workGroupIds: string[];
  joinedAt: Date | null;
}

export interface GroupEntry {
  id: string;
  name: string;
  leadIds: string[];
}

export type ManageOp =
  | {
      op: "member.update";
      memberId: string;
      displayName?: string;
      roleIds?: string[];
      workGroupIds?: string[];
    }
  | { op: "member.access"; memberId: string; on: boolean }
  | { op: "member.remove"; memberId: string }
  | {
      op: "member.invite";
      email: string;
      roleIds: string[];
      workGroupIds: string[];
    }
  | { op: "roles.save"; roles: RoleEntry[]; version: number }
  | { op: "group.leads"; groupId: string; leadIds: string[] }
  | { op: "owner.give"; memberId: string }
  | { op: "owner.stepDown" };

export type ActivityArea = "people" | "roles" | "groups" | "settings" | "tasks";

export interface ActivityEntry {
  area: ActivityArea;
  action: string;
  targetId: string | null;
  /** One line a person reads, written with names. */
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

/** What one protected change writes, once it's allowed. */
export interface ManagePlan {
  members: Record<string, Record<string, unknown>>;
  groups: Record<string, Record<string, unknown>>;
  roles: RoleEntry[] | null;
  /** A new member record for an invite, keyed by email until it has an id. */
  invite: { email: string; record: Record<string, unknown> } | null;
  activity: ActivityEntry[];
}

export type PlanError =
  DenyReason | "notFound" | "invalid" | "stale" | "alreadyMember";

export type PlanResult =
  { ok: true; plan: ManagePlan } | { ok: false; reason: PlanError };

/** Everything a plan may need to read. */
export interface ManageState {
  roles: RoleEntry[];
  rolesVersion: number;
  members: ReadonlyMap<string, MemberEntry>;
  groups: ReadonlyMap<string, GroupEntry>;
}

const fail = (reason: PlanError): PlanResult => ({ ok: false, reason });

const empty = (): ManagePlan => ({
  members: {},
  groups: {},
  roles: null,
  invite: null,
  activity: [],
});

/** The first refusal among several requests, or null when all are allowed. */
function refusal(
  actor: Actor,
  requests: readonly AccessRequest[],
): DenyReason | null {
  for (const request of requests) {
    const decision = decide(actor, request);
    if (!decision.ok) return decision.reason;
  }
  return null;
}

const added = (before: readonly string[], after: readonly string[]) =>
  after.filter((id) => !before.includes(id));
const removedFrom = (before: readonly string[], after: readonly string[]) =>
  before.filter((id) => !after.includes(id));

const nameOf = (member: MemberEntry) =>
  member.displayName || member.email || "Someone";

/** Removes these people as leads of the groups they're leaving. */
function dropLeads(
  plan: ManagePlan,
  state: ManageState,
  memberId: string,
  groupIds: readonly string[],
) {
  for (const groupId of groupIds) {
    const group = state.groups.get(groupId);
    if (group?.leadIds.includes(memberId))
      plan.groups[groupId] = {
        leadIds: group.leadIds.filter((id) => id !== memberId),
      };
  }
}

function roleList(state: ManageState, ids: readonly string[]) {
  return state.roles.filter((role) => ids.includes(role.id));
}

function planMemberUpdate(
  actor: Actor,
  state: ManageState,
  op: Extract<ManageOp, { op: "member.update" }>,
): PlanResult {
  const member = state.members.get(op.memberId);
  if (!member) return fail("notFound");
  const memberRank = rankOf(member.roleIds, state.roles);
  const requests: AccessRequest[] = [];
  const plan = empty();
  const change: Record<string, unknown> = {};

  if (
    op.displayName !== undefined &&
    op.displayName.trim() !== member.displayName
  ) {
    const name = op.displayName.trim();
    if (name.length > 80) return fail("invalid");
    requests.push({ action: "member.rename", memberRank });
    change.displayName = name;
    plan.activity.push({
      area: "people",
      action: "renamed",
      targetId: member.id,
      summary: `Renamed ${nameOf(member)} to ${name}`,
      before: { displayName: member.displayName },
      after: { displayName: name },
    });
  }

  if (op.roleIds !== undefined) {
    const next = [...new Set(op.roleIds)];
    const gained = added(member.roleIds, next);
    const lost = removedFrom(member.roleIds, next);
    if (gained.includes(OwnerRoleId) || lost.includes(OwnerRoleId))
      return fail("protectedRole");
    if (gained.length || lost.length) {
      requests.push({
        action: "member.setRoles",
        memberRank,
        added: roleList(state, gained),
        removed: roleList(state, lost),
      });
      change.roleIds = next;
      plan.activity.push({
        area: "people",
        action: "rolesChanged",
        targetId: member.id,
        summary: `Changed ${nameOf(member)}'s roles`,
        before: { roleIds: member.roleIds },
        after: { roleIds: next },
      });
    }
  }

  if (op.workGroupIds !== undefined) {
    const next = [...new Set(op.workGroupIds)];
    const joined = added(member.workGroupIds, next);
    const left = removedFrom(member.workGroupIds, next);
    if (joined.some((id) => !state.groups.has(id))) return fail("invalid");
    if (joined.length) requests.push({ action: "group.addMember" });
    if (left.length)
      requests.push({ action: "group.removeMember", memberRank });
    if (joined.length || left.length) {
      change.workGroupIds = next;
      dropLeads(plan, state, member.id, left);
      plan.activity.push({
        area: "groups",
        action: "membershipChanged",
        targetId: member.id,
        summary: `Changed ${nameOf(member)}'s work groups`,
        before: { workGroupIds: member.workGroupIds },
        after: { workGroupIds: next },
      });
    }
  }

  const refused = refusal(actor, requests);
  if (refused) return fail(refused);
  if (Object.keys(change).length) plan.members[member.id] = change;
  return { ok: true, plan };
}

function planAccess(
  actor: Actor,
  state: ManageState,
  op: Extract<ManageOp, { op: "member.access" }>,
): PlanResult {
  const member = state.members.get(op.memberId);
  if (!member) return fail("notFound");
  if (member.status === "removed") return fail("invalid");
  const refused = refusal(actor, [
    {
      action: "member.setAccess",
      memberRank: rankOf(member.roleIds, state.roles),
    },
  ]);
  if (refused) return fail(refused);
  const status: MemberStatus = op.on
    ? member.joinedAt
      ? "active"
      : "invited"
    : "disabled";
  if (status === member.status) return { ok: true, plan: empty() };
  const plan = empty();
  plan.members[member.id] = { status };
  plan.activity.push({
    area: "people",
    action: op.on ? "accessOn" : "accessOff",
    targetId: member.id,
    summary: `${op.on ? "Turned access back on for" : "Turned off access for"} ${nameOf(member)}`,
    before: { status: member.status },
    after: { status },
  });
  return { ok: true, plan };
}

function planRemove(
  actor: Actor,
  state: ManageState,
  op: Extract<ManageOp, { op: "member.remove" }>,
): PlanResult {
  const member = state.members.get(op.memberId);
  if (!member) return fail("notFound");
  const refused = refusal(actor, [
    {
      action: "member.remove",
      memberRank: rankOf(member.roleIds, state.roles),
    },
  ]);
  if (refused) return fail(refused);
  const plan = empty();
  plan.members[member.id] = {
    status: "removed",
    roleIds: [],
    workGroupIds: [],
  };
  dropLeads(plan, state, member.id, member.workGroupIds);
  plan.activity.push({
    area: "people",
    action: "removed",
    targetId: member.id,
    summary: `Removed ${nameOf(member)} from the workspace`,
    before: {
      status: member.status,
      roleIds: member.roleIds,
      workGroupIds: member.workGroupIds,
    },
    after: { status: "removed" },
  });
  return { ok: true, plan };
}

function planInvite(
  actor: Actor,
  state: ManageState,
  op: Extract<ManageOp, { op: "member.invite" }>,
  existing: MemberEntry | null,
): PlanResult {
  const email = op.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("invalid");
  if (existing && existing.status !== "removed") return fail("alreadyMember");
  const roleIds = [...new Set(op.roleIds)];
  if (roleIds.includes(OwnerRoleId)) return fail("protectedRole");
  const workGroupIds = [...new Set(op.workGroupIds)];
  if (workGroupIds.some((id) => !state.groups.has(id))) return fail("invalid");
  const requests: AccessRequest[] = [
    { action: "member.invite", roles: roleList(state, roleIds) },
  ];
  if (workGroupIds.length) requests.push({ action: "group.addMember" });
  const refused = refusal(actor, requests);
  if (refused) return fail(refused);
  const plan = empty();
  const fields = {
    status: "invited",
    roleIds,
    workGroupIds,
    invitedBy: actor.id,
  };
  if (existing) plan.members[existing.id] = fields;
  else
    plan.invite = {
      email,
      record: {
        ...fields,
        displayName: "",
        email,
        timeZone: null,
        joinedAt: null,
        lastActiveAt: null,
      },
    };
  plan.activity.push({
    area: "people",
    action: existing ? "reinvited" : "invited",
    targetId: existing?.id ?? null,
    summary: `${existing ? "Invited back" : "Invited"} ${email}`,
    before: null,
    after: { roleIds, workGroupIds },
  });
  return { ok: true, plan };
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((entry) => b.includes(entry));

function planRoles(
  actor: Actor,
  state: ManageState,
  op: Extract<ManageOp, { op: "roles.save" }>,
): PlanResult {
  if (op.version !== state.rolesVersion) return fail("stale");
  const next = op.roles.filter((role) => role.id !== OwnerRoleId);
  const owner = state.roles.find((role) => role.id === OwnerRoleId);
  const everyone = next.find((role) => role.id === "everyone");
  if (!everyone || everyone.position !== 0) return fail("invalid");
  const positions = next.map((role) => role.position);
  if (new Set(positions).size !== positions.length) return fail("invalid");
  if (
    next.some(
      (role) =>
        role.id !== "everyone" &&
        (role.position <= 0 || role.position >= OwnerRank),
    )
  )
    return fail("invalid");
  if (next.some((role) => !role.name.trim() || role.name.length > 80))
    return fail("invalid");

  const requests: AccessRequest[] = [];
  const plan = empty();
  for (const role of next) {
    const before = state.roles.find((entry) => entry.id === role.id);
    if (!before) {
      requests.push({
        action: "role.create",
        position: role.position,
        permissions: role.permissions,
      });
      plan.activity.push({
        area: "roles",
        action: "created",
        targetId: role.id,
        summary: `Created the ${role.name} role`,
        before: null,
        after: { name: role.name, permissions: role.permissions },
      });
      continue;
    }
    const changed = [
      ...added(before.permissions, role.permissions),
      ...removedFrom(before.permissions, role.permissions),
    ];
    const moved = before.position !== role.position;
    const touched =
      moved ||
      changed.length > 0 ||
      before.name !== role.name ||
      before.color !== role.color ||
      before.description !== role.description;
    if (!touched) continue;
    requests.push({
      action: "role.edit",
      role: before,
      position: role.position,
      changed,
    });
    plan.activity.push({
      area: "roles",
      action: moved && !changed.length ? "moved" : "edited",
      targetId: role.id,
      summary: `${moved && !changed.length ? "Moved" : "Changed"} the ${before.name} role`,
      before: {
        name: before.name,
        position: before.position,
        permissions: before.permissions,
      },
      after: {
        name: role.name,
        position: role.position,
        permissions: role.permissions,
      },
    });
  }
  for (const before of state.roles) {
    if (before.id === OwnerRoleId) continue;
    if (next.some((role) => role.id === before.id)) continue;
    requests.push({ action: "role.delete", role: before });
    // Take the deleted role off everyone who had it.
    for (const member of state.members.values()) {
      if (!member.roleIds.includes(before.id)) continue;
      const current =
        (plan.members[member.id]?.roleIds as string[] | undefined) ??
        member.roleIds;
      plan.members[member.id] = {
        roleIds: current.filter((id) => id !== before.id),
      };
    }
    plan.activity.push({
      area: "roles",
      action: "deleted",
      targetId: before.id,
      summary: `Deleted the ${before.name} role`,
      before: { name: before.name, permissions: before.permissions },
      after: null,
    });
  }
  const refused = refusal(actor, requests);
  if (refused) return fail(refused);
  plan.roles = owner ? [...next, owner] : next;
  return { ok: true, plan };
}

function planLeads(
  actor: Actor,
  state: ManageState,
  op: Extract<ManageOp, { op: "group.leads" }>,
): PlanResult {
  const group = state.groups.get(op.groupId);
  if (!group) return fail("notFound");
  const leadIds = [...new Set(op.leadIds)];
  if (leadIds.length > 10) return fail("invalid");
  const people = leadIds.map((id) => state.members.get(id));
  if (people.some((person) => !person || person.status === "removed"))
    return fail("invalid");
  const refused = refusal(actor, [{ action: "group.setLeads" }]);
  if (refused) return fail(refused);
  if (sameList(group.leadIds, leadIds)) return { ok: true, plan: empty() };
  const plan = empty();
  plan.groups[group.id] = { leadIds };
  // A lead is always a member: making someone a lead puts them in the group.
  for (const person of people)
    if (person && !person.workGroupIds.includes(group.id))
      plan.members[person.id] = {
        workGroupIds: [...person.workGroupIds, group.id],
      };
  plan.activity.push({
    area: "groups",
    action: "leadsChanged",
    targetId: group.id,
    summary: `Changed ${group.name}'s leads`,
    before: { leadIds: group.leadIds },
    after: { leadIds },
  });
  return { ok: true, plan };
}

function planOwner(
  actor: Actor,
  state: ManageState,
  op: Extract<ManageOp, { op: "owner.give" } | { op: "owner.stepDown" }>,
): PlanResult {
  const plan = empty();
  if (op.op === "owner.give") {
    const member = state.members.get(op.memberId);
    if (!member) return fail("notFound");
    if (member.status === "removed" || member.status === "disabled")
      return fail("invalid");
    const refused = refusal(actor, [{ action: "owner.give" }]);
    if (refused) return fail(refused);
    if (member.roleIds.includes(OwnerRoleId)) return { ok: true, plan };
    plan.members[member.id] = { roleIds: [...member.roleIds, OwnerRoleId] };
    plan.activity.push({
      area: "roles",
      action: "ownerGiven",
      targetId: member.id,
      summary: `Made ${nameOf(member)} an Owner`,
      before: null,
      after: null,
    });
    return { ok: true, plan };
  }
  const me = state.members.get(actor.id);
  if (!me) return fail("notFound");
  const otherOwners = [...state.members.values()].filter(
    (member) =>
      member.id !== actor.id &&
      member.status !== "removed" &&
      member.roleIds.includes(OwnerRoleId),
  ).length;
  const refused = refusal(actor, [{ action: "owner.stepDown", otherOwners }]);
  if (refused) return fail(refused);
  plan.members[me.id] = {
    roleIds: me.roleIds.filter((id) => id !== OwnerRoleId),
  };
  plan.activity.push({
    area: "roles",
    action: "ownerSteppedDown",
    targetId: me.id,
    summary: `${nameOf(me)} stepped down as Owner`,
    before: null,
    after: null,
  });
  return { ok: true, plan };
}

/** Works out a protected change: what to write, or why not. */
export function planManage(
  actor: Actor,
  state: ManageState,
  op: ManageOp,
  existingInvitee: MemberEntry | null = null,
): PlanResult {
  switch (op.op) {
    case "member.update":
      return planMemberUpdate(actor, state, op);
    case "member.access":
      return planAccess(actor, state, op);
    case "member.remove":
      return planRemove(actor, state, op);
    case "member.invite":
      return planInvite(actor, state, op, existingInvitee);
    case "roles.save":
      return planRoles(actor, state, op);
    case "group.leads":
      return planLeads(actor, state, op);
    case "owner.give":
    case "owner.stepDown":
      return planOwner(actor, state, op);
  }
}
