// File : /TeamSamsara.Workflow/engine/src/access/accessCases.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The one table of cases the permission model is held to: who acts,
// what they try, to what, and whether it's allowed. decide() runs every case
// (access.test.ts); the database rules run the ones marked for them against
// the emulator (tests/rules), so the two can't drift apart.

import type { AccessRequest, EventScope, TaskScope } from "./decide.js";
import {
  actorOf,
  OwnerRank,
  OwnerRoleId,
  type Actor,
  type MemberStatus,
  type RoleForAccess,
} from "./model.js";

// #region The workspace the cases run in
export const caseRoles: RoleForAccess[] = [
  { id: "everyone", position: 0, permissions: ["doAssignedTasks"] },
  { id: "contributor", position: 10, permissions: ["doAssignedTasks"] },
  {
    id: "planner",
    position: 20,
    permissions: [
      "planEvents",
      "editWorkflows",
      "createStandaloneTasks",
      "reassignTasks",
      "approveTasks",
    ],
  },
  {
    id: "manager",
    position: 30,
    permissions: ["manageMembers", "manageRoles", "manageWorkGroups"],
  },
  { id: "admin", position: 40, permissions: ["administrator"] },
  { id: OwnerRoleId, position: OwnerRank, permissions: ["administrator"] },
];

const role = (id: string) => {
  const found = caseRoles.find((entry) => entry.id === id);
  if (!found) throw new Error(`No role ${id}`);
  return found;
};

interface PersonSpec {
  roleIds: string[];
  groupIds?: string[];
  leadOf?: string[];
  status?: MemberStatus;
}

/** The people in the cases. Design has Lena as lead; Marketing has none. */
export const casePeople = {
  owner: { roleIds: [OwnerRoleId] },
  owner2: { roleIds: [OwnerRoleId] },
  admin: { roleIds: ["admin"] },
  admin2: { roleIds: ["admin"] },
  manager: { roleIds: ["manager"] },
  planner: { roleIds: ["planner"], groupIds: ["design"] },
  planner2: { roleIds: ["planner"] },
  lena: { roleIds: ["contributor"], groupIds: ["design"], leadOf: ["design"] },
  dev: { roleIds: ["contributor"], groupIds: ["design"] },
  maya: { roleIds: ["contributor"], groupIds: ["marketing"] },
  newbie: { roleIds: [], groupIds: ["design"] },
  gone: { roleIds: ["planner"], status: "disabled" },
} satisfies Record<string, PersonSpec>;

export type CasePerson = keyof typeof casePeople;

export function caseActor(id: CasePerson): Actor {
  const spec: PersonSpec = casePeople[id];
  return actorOf(
    {
      id,
      status: spec.status ?? "active",
      roleIds: spec.roleIds,
      workGroupIds: spec.groupIds ?? [],
    },
    caseRoles,
    spec.leadOf ?? [],
  );
}

export const rankOfCase = (id: CasePerson) => caseActor(id).rank;
// #endregion

// #region Things the cases act on
/** An event for the Design group, made by a planner. */
export const designEvent: EventScope = {
  everyone: false,
  memberIds: [],
  groupIds: ["design"],
  createdBy: "planner",
  ownerRank: 20,
};

/** An event only Marketing is in, made by an Administrator. */
export const marketingEvent: EventScope = {
  everyone: false,
  memberIds: [],
  groupIds: ["marketing"],
  createdBy: "admin",
  ownerRank: 40,
};

/** A Design task on the Design event, given to someone, maybe sent for review. */
export function designTask(
  memberId: CasePerson | null,
  options: { review?: boolean; event?: EventScope | null } = {},
): TaskScope {
  const rank = memberId ? rankOfCase(memberId) : null;
  return {
    groupId: "design",
    memberId,
    createdBy: "planner",
    event: options.event === undefined ? designEvent : options.event,
    sentForReviewBy: options.review ? memberId : null,
    awaitingReview: options.review ?? false,
    ranks: { assignee: rank, doer: rank, maker: 20 },
  };
}

/** A one-off task someone made for themselves or another. */
export function oneOff(maker: CasePerson, memberId: CasePerson | null) {
  const rank = memberId ? rankOfCase(memberId) : null;
  return {
    groupId: null,
    memberId,
    createdBy: maker,
    event: null,
    sentForReviewBy: null,
    awaitingReview: false,
    ranks: { assignee: rank, doer: rank, maker: rankOfCase(maker) },
  } satisfies TaskScope;
}
// #endregion

export interface AccessCase {
  name: string;
  actor: CasePerson;
  request: AccessRequest;
  allowed: boolean;
}

const to = (
  memberId: CasePerson | null,
  groupId: string | null = "design",
) => ({
  memberId,
  groupId,
  rank: memberId ? rankOfCase(memberId) : null,
  eligible: memberId !== "gone",
});

export const accessCases: AccessCase[] = [
  // #region Approving: never your own work, at or below the doer
  {
    name: "a planner approves a contributor's work",
    actor: "planner",
    request: {
      action: "task.approve",
      task: designTask("dev", { review: true }),
    },
    allowed: true,
  },
  {
    name: "a planner approves a peer planner's work",
    actor: "planner",
    request: {
      action: "task.approve",
      task: designTask("planner2", { review: true }),
    },
    allowed: true,
  },
  {
    name: "a planner can't approve an admin's work",
    actor: "planner",
    request: {
      action: "task.approve",
      task: designTask("admin", { review: true }),
    },
    allowed: false,
  },
  {
    name: "nobody approves their own work, even a planner",
    actor: "planner",
    request: {
      action: "task.approve",
      task: designTask("planner", { review: true }),
    },
    allowed: false,
  },
  {
    name: "nobody approves their own work, even an Owner",
    actor: "owner",
    request: {
      action: "task.approve",
      task: designTask("owner", { review: true }),
    },
    allowed: false,
  },
  {
    name: "a lead approves their group's task without Approve tasks",
    actor: "lena",
    request: {
      action: "task.approve",
      task: designTask("dev", { review: true }),
    },
    allowed: true,
  },
  {
    name: "a lead can't approve a task done by someone above them",
    actor: "lena",
    request: {
      action: "task.approve",
      task: designTask("planner", { review: true }),
    },
    allowed: false,
  },
  {
    name: "a lead can't approve another group's task",
    actor: "lena",
    request: {
      action: "task.approve",
      task: { ...designTask("maya", { review: true }), groupId: "marketing" },
    },
    allowed: false,
  },
  {
    name: "a contributor who isn't a lead can't approve",
    actor: "dev",
    request: {
      action: "task.approve",
      task: designTask("newbie", { review: true }),
    },
    allowed: false,
  },
  {
    name: "nothing to approve until it's sent for review",
    actor: "planner",
    request: { action: "task.approve", task: designTask("dev") },
    allowed: false,
  },
  {
    name: "Administrators can approve each other's work",
    actor: "admin",
    request: {
      action: "task.approve",
      task: designTask("admin2", { review: true }),
    },
    allowed: true,
  },
  {
    name: "an Administrator can't approve an Owner's work",
    actor: "admin",
    request: {
      action: "task.approve",
      task: designTask("owner", { review: true }),
    },
    allowed: false,
  },
  {
    name: "Owners approve each other's work",
    actor: "owner",
    request: {
      action: "task.approve",
      task: designTask("owner2", { review: true }),
    },
    allowed: true,
  },
  // #endregion

  // #region Doing, claiming and seeing tasks
  {
    name: "the person a task is given to does it",
    actor: "dev",
    request: { action: "task.do", task: designTask("dev") },
    allowed: true,
  },
  {
    name: "a group member does a group task with no one named",
    actor: "dev",
    request: { action: "task.do", task: designTask(null) },
    allowed: true,
  },
  {
    name: "a group member can't do a task given to someone else",
    actor: "dev",
    request: { action: "task.do", task: designTask("lena") },
    allowed: false,
  },
  {
    name: "a member claims a waiting group task",
    actor: "dev",
    request: { action: "task.claim", task: designTask(null), takesTasks: true },
    allowed: true,
  },
  {
    name: "a member who doesn't take tasks can't claim",
    actor: "dev",
    request: {
      action: "task.claim",
      task: designTask(null),
      takesTasks: false,
    },
    allowed: false,
  },
  {
    name: "nobody claims a task that already has someone",
    actor: "dev",
    request: {
      action: "task.claim",
      task: designTask("lena"),
      takesTasks: true,
    },
    allowed: false,
  },
  {
    name: "someone outside the group can't claim",
    actor: "maya",
    request: { action: "task.claim", task: designTask(null), takesTasks: true },
    allowed: false,
  },
  {
    name: "a planner sees the tasks of an event they can see",
    actor: "planner",
    request: { action: "task.view", task: designTask("dev") },
    allowed: true,
  },
  {
    name: "a planner can't see the tasks of an event they can't see",
    actor: "planner2",
    request: { action: "task.view", task: designTask("dev") },
    allowed: false,
  },
  {
    name: "an approver sees a task waiting for review anywhere",
    actor: "planner2",
    request: { action: "task.view", task: designTask("dev", { review: true }) },
    allowed: true,
  },
  {
    name: "a lead sees their group's tasks",
    actor: "lena",
    request: { action: "task.view", task: designTask("dev") },
    allowed: true,
  },
  {
    name: "someone turned off can't see anything",
    actor: "gone",
    request: { action: "task.view", task: designTask("dev") },
    allowed: false,
  },
  // #endregion

  // #region Editing, reassigning and deleting tasks
  {
    name: "a planner edits a task of their own event",
    actor: "planner",
    request: { action: "task.editContent", task: designTask("dev") },
    allowed: true,
  },
  {
    name: "a planner can't edit a task given to someone above them",
    actor: "planner",
    request: { action: "task.editContent", task: designTask("admin") },
    allowed: false,
  },
  {
    name: "a planner can't edit tasks of an event they can't see",
    actor: "planner2",
    request: { action: "task.editContent", task: designTask("dev") },
    allowed: false,
  },
  {
    name: "a planner can't edit tasks of an event made by someone above them",
    actor: "planner",
    request: {
      action: "task.editContent",
      task: { ...designTask("dev"), event: { ...designEvent, ownerRank: 40 } },
    },
    allowed: false,
  },
  {
    name: "a one-off's maker edits it",
    actor: "dev",
    request: { action: "task.editContent", task: oneOff("dev", "dev") },
    allowed: true,
  },
  {
    name: "a one-off's maker can't edit it once it's given to someone above them",
    actor: "dev",
    request: { action: "task.editContent", task: oneOff("dev", "planner") },
    allowed: false,
  },
  {
    name: "a lead reassigns within their group",
    actor: "lena",
    request: {
      action: "task.reassign",
      task: designTask("dev"),
      to: to("newbie"),
    },
    allowed: true,
  },
  {
    name: "a lead can't move a task out of their group",
    actor: "lena",
    request: {
      action: "task.reassign",
      task: designTask("dev"),
      to: to("maya", "marketing"),
    },
    allowed: false,
  },
  {
    name: "a lead can't take a task from someone above them",
    actor: "lena",
    request: {
      action: "task.reassign",
      task: designTask("planner"),
      to: to("dev"),
    },
    allowed: false,
  },
  {
    name: "nobody hands a task to someone above them",
    actor: "planner",
    request: {
      action: "task.reassign",
      task: designTask("dev"),
      to: to("admin"),
    },
    allowed: false,
  },
  {
    name: "nobody hands a task to someone turned off",
    actor: "planner",
    request: {
      action: "task.reassign",
      task: designTask("dev"),
      to: to("gone"),
    },
    allowed: false,
  },
  {
    name: "a planner deletes a task of their own event",
    actor: "planner",
    request: { action: "task.delete", task: designTask("dev") },
    allowed: true,
  },
  {
    name: "a planner can't delete a task of an event they can't see",
    actor: "planner2",
    request: { action: "task.delete", task: designTask("dev") },
    allowed: false,
  },
  // #endregion

  // #region Events
  {
    name: "a planner edits an event they made",
    actor: "planner",
    request: { action: "event.edit", event: designEvent },
    allowed: true,
  },
  {
    name: "a planner can't edit an event they can't see",
    actor: "planner2",
    request: { action: "event.edit", event: designEvent },
    allowed: false,
  },
  {
    name: "a planner can't delete an event made by someone above them",
    actor: "planner",
    request: {
      action: "event.delete",
      event: { ...designEvent, ownerRank: 40 },
    },
    allowed: false,
  },
  {
    name: "an Administrator deletes a planner's event they can see",
    actor: "admin",
    request: { action: "event.delete", event: designEvent },
    allowed: true,
  },
  {
    name: "a planner can't remind people about an event they can't see",
    actor: "planner2",
    request: { action: "event.remind", event: designEvent },
    allowed: false,
  },
  // #endregion

  // #region Workflows and fields
  {
    name: "a workflow editor names someone below them on a step",
    actor: "planner",
    request: { action: "workflow.namePerson", personRank: 10 },
    allowed: true,
  },
  {
    name: "a workflow editor can't name someone above them",
    actor: "planner",
    request: { action: "workflow.namePerson", personRank: 40 },
    allowed: false,
  },
  {
    name: "a workflow editor deletes a field",
    actor: "planner",
    request: { action: "field.delete" },
    allowed: true,
  },
  // #endregion

  // #region Groups
  {
    name: "a lead chooses who takes their group's tasks",
    actor: "lena",
    request: { action: "group.setTakesTasks", groupId: "design" },
    allowed: true,
  },
  {
    name: "a lead can't change their group's assignment settings",
    actor: "lena",
    request: { action: "group.settings" },
    allowed: false,
  },
  {
    name: "a lead can't choose who takes another group's tasks",
    actor: "lena",
    request: { action: "group.setTakesTasks", groupId: "marketing" },
    allowed: false,
  },
  {
    name: "a manager can't take someone above them out of a group",
    actor: "manager",
    request: { action: "group.removeMember", memberRank: 40 },
    allowed: false,
  },
  // #endregion

  // #region People: strictly below
  {
    name: "a manager turns off a planner's access",
    actor: "manager",
    request: { action: "member.setAccess", memberRank: 20 },
    allowed: true,
  },
  {
    name: "a manager can't turn off a peer manager's access",
    actor: "manager",
    request: { action: "member.setAccess", memberRank: 30 },
    allowed: false,
  },
  {
    name: "a manager can't turn off their own access",
    actor: "manager",
    request: { action: "member.setAccess", memberRank: rankOfCase("manager") },
    allowed: false,
  },
  {
    name: "a manager can't remove an Administrator",
    actor: "manager",
    request: { action: "member.remove", memberRank: 40 },
    allowed: false,
  },
  {
    name: "an Administrator can't remove another Administrator",
    actor: "admin",
    request: { action: "member.remove", memberRank: 40 },
    allowed: false,
  },
  {
    name: "an Administrator can't remove an Owner",
    actor: "admin",
    request: { action: "member.remove", memberRank: OwnerRank },
    allowed: false,
  },
  {
    name: "an Owner can't remove another Owner",
    actor: "owner",
    request: { action: "member.remove", memberRank: OwnerRank },
    allowed: false,
  },
  {
    name: "an Owner removes an Administrator",
    actor: "owner",
    request: { action: "member.remove", memberRank: 40 },
    allowed: true,
  },
  {
    name: "a manager gives a contributor the planner role, holding none of its permissions",
    actor: "manager",
    request: {
      action: "member.setRoles",
      memberRank: 10,
      added: [role("planner")],
      removed: [],
    },
    allowed: false,
  },
  {
    name: "an Administrator gives a contributor the planner role",
    actor: "admin",
    request: {
      action: "member.setRoles",
      memberRank: 10,
      added: [role("planner")],
      removed: [],
    },
    allowed: true,
  },
  {
    name: "nobody gives a role at their own rank",
    actor: "admin",
    request: {
      action: "member.setRoles",
      memberRank: 10,
      added: [role("admin")],
      removed: [],
    },
    allowed: false,
  },
  {
    name: "nobody gives the Owner role through roles",
    actor: "owner",
    request: {
      action: "member.setRoles",
      memberRank: 10,
      added: [role(OwnerRoleId)],
      removed: [],
    },
    allowed: false,
  },
  {
    name: "a manager can't invite someone with a role at their rank",
    actor: "manager",
    request: { action: "member.invite", roles: [role("manager")] },
    allowed: false,
  },
  {
    name: "an Administrator can't take down an Owner's photo",
    actor: "admin",
    request: {
      action: "member.removePhoto",
      memberId: "owner",
      memberRank: OwnerRank,
    },
    allowed: false,
  },
  // #endregion

  // #region Roles and Owners
  {
    name: "a manager can't edit a role at their own rank",
    actor: "manager",
    request: {
      action: "role.edit",
      role: role("manager"),
      position: 30,
      changed: [],
    },
    allowed: false,
  },
  {
    name: "a manager can't move a role up to their rank",
    actor: "manager",
    request: { action: "role.reorder", moves: [{ from: 10, to: 30 }] },
    allowed: false,
  },
  {
    name: "a manager changes what Everyone can do, within what they hold",
    actor: "manager",
    request: {
      action: "role.edit",
      role: role("everyone"),
      position: 0,
      changed: ["tagPeople"],
    },
    allowed: false,
  },
  {
    name: "an Administrator changes what Everyone can do",
    actor: "admin",
    request: {
      action: "role.edit",
      role: role("everyone"),
      position: 0,
      changed: ["tagPeople"],
    },
    allowed: true,
  },
  {
    name: "nobody can edit the Owner role",
    actor: "owner",
    request: {
      action: "role.edit",
      role: role(OwnerRoleId),
      position: OwnerRank,
      changed: [],
    },
    allowed: false,
  },
  {
    name: "a manager reorders roles below them",
    actor: "manager",
    request: { action: "role.reorder", moves: [{ from: 10, to: 25 }] },
    allowed: true,
  },
  {
    name: "an Administrator can't delete the Administrator role",
    actor: "admin",
    request: { action: "role.delete", role: role("admin") },
    allowed: false,
  },
  {
    name: "an Owner makes someone an Owner",
    actor: "owner",
    request: { action: "owner.give" },
    allowed: true,
  },
  {
    name: "an Administrator can't make anyone an Owner",
    actor: "admin",
    request: { action: "owner.give" },
    allowed: false,
  },
  {
    name: "an Owner steps down while another remains",
    actor: "owner",
    request: { action: "owner.stepDown", otherOwners: 1 },
    allowed: true,
  },
  {
    name: "the last Owner can't step down",
    actor: "owner",
    request: { action: "owner.stepDown", otherOwners: 0 },
    allowed: false,
  },
  // #endregion

  // #region Settings
  {
    name: "only Administrators open the activity history and admin settings",
    actor: "manager",
    request: { action: "settings.admin" },
    allowed: false,
  },
  {
    name: "an Owner can do every Administrator thing",
    actor: "owner",
    request: { action: "settings.admin" },
    allowed: true,
  },
  // #endregion
];
