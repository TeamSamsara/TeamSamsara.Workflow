// File : /TeamSamsara.Workflow/engine/src/access/decide.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The one answer to "can this person do this, to this, here?".
// Permissions say what, rank says over whom (at your rank or below for tasks
// and events, strictly below for people and roles), scope says where (the
// workspace, a group they lead or are in, an event they can see, themselves).
// Nobody approves their own work. The screens show buttons from it, the
// server functions refuse with it, and the database rules are tested
// against the same cases (accessCases.ts).

import {
  atOrBelow,
  canAct,
  holds,
  strictlyBelow,
  type Actor,
  type PermissionKey,
  type RoleForAccess,
} from "./model.js";

/** Who can see an event, and whose rank it follows. */
export interface EventScope {
  everyone: boolean;
  memberIds: readonly string[];
  groupIds: readonly string[];
  createdBy: string;
  /** The rank of whoever owns it: its maker, or the maker of its repeat. */
  ownerRank: number;
}

/** A task, with the ranks of the people it involves looked up by the caller. */
export interface TaskScope {
  groupId: string | null;
  /** Who it's given to; null when it's the whole group's, or no one's. */
  memberId: string | null;
  createdBy: string;
  event: EventScope | null;
  sentForReviewBy: string | null;
  /** Waiting for someone to approve it. */
  awaitingReview: boolean;
  ranks: {
    assignee: number | null;
    /** Whoever sent it for review, else the assignee. */
    doer: number | null;
    maker: number;
  };
}

/** Where a reassigned task goes. */
export interface ReassignTo {
  memberId: string | null;
  groupId: string | null;
  /** The new person's rank, when there is one. */
  rank: number | null;
  /** Active, can do tasks, and in the task's group when it has one. */
  eligible: boolean;
}

export type AccessRequest =
  | { action: "task.view"; task: TaskScope }
  | { action: "task.do"; task: TaskScope }
  | { action: "task.claim"; task: TaskScope; takesTasks: boolean }
  | { action: "task.editContent"; task: TaskScope }
  | { action: "task.reassign"; task: TaskScope; to: ReassignTo }
  | { action: "task.approve"; task: TaskScope }
  | { action: "task.delete"; task: TaskScope }
  | { action: "task.createOneOff" }
  | { action: "task.createInEvent"; event: EventScope }
  | { action: "event.view"; event: EventScope }
  | { action: "event.create" }
  | { action: "event.edit"; event: EventScope }
  | { action: "event.delete"; event: EventScope }
  | { action: "event.reply"; event: EventScope; asksReply: boolean }
  | { action: "event.remind"; event: EventScope }
  | { action: "workflow.edit" }
  | { action: "workflow.namePerson"; personRank: number }
  | { action: "field.create" }
  | { action: "field.edit" }
  | { action: "field.delete" }
  | { action: "group.manage" }
  | { action: "group.addMember" }
  | { action: "group.removeMember"; memberRank: number }
  | { action: "group.setLeads" }
  | { action: "group.settings" }
  | { action: "group.setTakesTasks"; groupId: string }
  | { action: "member.invite"; roles: readonly RoleForAccess[] }
  | { action: "member.rename"; memberRank: number }
  | { action: "member.setAccess"; memberRank: number }
  | { action: "member.remove"; memberRank: number }
  | {
      action: "member.setRoles";
      memberRank: number;
      added: readonly RoleForAccess[];
      removed: readonly RoleForAccess[];
    }
  | { action: "member.tag" }
  | { action: "member.removePhoto"; memberId: string; memberRank: number }
  | { action: "role.create"; position: number; permissions: readonly string[] }
  | {
      action: "role.edit";
      role: RoleForAccess;
      /** Where it moves to, when it moves. */
      position: number;
      /** Permissions switched on or off by the edit. */
      changed: readonly string[];
    }
  | { action: "role.delete"; role: RoleForAccess }
  | {
      action: "role.reorder";
      moves: readonly { from: number; to: number }[];
    }
  | { action: "owner.give" }
  | { action: "owner.stepDown"; otherOwners: number }
  | { action: "settings.workspace" }
  | { action: "settings.taskSetup" }
  | { action: "settings.admin" };

export type AccessAction = AccessRequest["action"];

/** Why something isn't allowed, for the screens to explain. */
export type DenyReason =
  | "noAccess"
  | "missingPermission"
  | "outOfScope"
  | "cantSeeEvent"
  | "outranked"
  | "notBelow"
  | "ownWork"
  | "notEligible"
  | "notWaiting"
  | "notInGroup"
  | "taken"
  | "ownerOnly"
  | "lastOwner"
  | "protectedRole";

export type Decision = { ok: true } | { ok: false; reason: DenyReason };

const yes: Decision = { ok: true };
const no = (reason: DenyReason): Decision => ({ ok: false, reason });

/** The first refusal, or yes when every check passes. */
function all(...checks: (DenyReason | null)[]): Decision {
  const failed = checks.find((check) => check !== null);
  return failed ? no(failed) : yes;
}

const need = (actor: Actor, permission: PermissionKey): DenyReason | null =>
  holds(actor, permission) ? null : "missingPermission";

const rankAtOrBelow = (actor: Actor, rank: number | null): DenyReason | null =>
  rank === null || atOrBelow(actor, rank) ? null : "outranked";

const rankBelow = (actor: Actor, rank: number): DenyReason | null =>
  strictlyBelow(actor, rank) ? null : "notBelow";

/** In the event by name, through a group, for everyone, its maker, or View all. */
export function canSeeEvent(actor: Actor, event: EventScope): boolean {
  return (
    canAct(actor) &&
    (event.everyone ||
      event.memberIds.includes(actor.id) ||
      event.groupIds.some((id) => actor.groupIds.includes(id)) ||
      event.createdBy === actor.id ||
      actor.permissions.has("viewAll"))
  );
}

/** In the event itself (not only allowed to see it): who replies. */
export function isInEvent(actor: Actor, event: EventScope): boolean {
  return (
    event.everyone ||
    event.memberIds.includes(actor.id) ||
    event.groupIds.some((id) => actor.groupIds.includes(id))
  );
}

const leads = (actor: Actor, groupId: string | null) =>
  groupId !== null && actor.leadOf.includes(groupId);

const inGroup = (actor: Actor, groupId: string | null) =>
  groupId !== null && actor.groupIds.includes(groupId);

/** Given to them, or to their group with no one named. */
function isTheirsToDo(actor: Actor, task: TaskScope): boolean {
  return (
    task.memberId === actor.id ||
    (task.memberId === null && inGroup(actor, task.groupId))
  );
}

/** A one-off task's maker, who may edit, reassign and delete it. */
const madeOneOff = (actor: Actor, task: TaskScope) =>
  task.event === null && task.createdBy === actor.id;

/** A planner of the task's event: can see it, and outranks or equals its owner. */
function plansEventOf(actor: Actor, task: TaskScope): boolean {
  return (
    task.event !== null &&
    holds(actor, "planEvents") &&
    canSeeEvent(actor, task.event) &&
    atOrBelow(actor, task.event.ownerRank)
  );
}

/** Whose rank editing or reassigning a task is held to: its person, or a one-off's maker. */
function subjectRank(task: TaskScope): number | null {
  if (task.ranks.assignee !== null) return task.ranks.assignee;
  return task.event === null ? task.ranks.maker : null;
}

/** Every permission the roles switch on is held by the actor. */
function holdsAll(
  actor: Actor,
  permissions: readonly string[],
): DenyReason | null {
  return permissions.every((permission) =>
    actor.permissions.has(permission as PermissionKey),
  )
    ? null
    : "missingPermission";
}

/** A role the actor manages: strictly below them, and not Everyone or Owner. */
function managesRole(actor: Actor, role: RoleForAccess): DenyReason | null {
  if (role.id === "everyone" || role.id === "owner") return "protectedRole";
  return rankBelow(actor, role.position);
}

export function decide(actor: Actor, request: AccessRequest): Decision {
  if (!canAct(actor)) return no("noAccess");
  switch (request.action) {
    // #region Tasks
    case "task.view": {
      const { task } = request;
      return isTheirsToDo(actor, task) ||
        inGroup(actor, task.groupId) ||
        task.createdBy === actor.id ||
        leads(actor, task.groupId) ||
        (task.event !== null &&
          holds(actor, "planEvents") &&
          canSeeEvent(actor, task.event)) ||
        holds(actor, "viewAll") ||
        holds(actor, "editAnyTask") ||
        (holds(actor, "approveTasks") && task.awaitingReview)
        ? yes
        : no("outOfScope");
    }
    case "task.do":
      return all(
        need(actor, "doAssignedTasks"),
        isTheirsToDo(actor, request.task) ? null : "outOfScope",
      );
    case "task.claim": {
      const { task } = request;
      return all(
        need(actor, "doAssignedTasks"),
        inGroup(actor, task.groupId) ? null : "notInGroup",
        task.memberId === null ? null : "taken",
        request.takesTasks ? null : "notEligible",
      );
    }
    case "task.editContent": {
      const { task } = request;
      const allowed =
        holds(actor, "editAnyTask") ||
        madeOneOff(actor, task) ||
        plansEventOf(actor, task);
      return all(
        allowed ? null : "missingPermission",
        rankAtOrBelow(actor, subjectRank(task)),
      );
    }
    case "task.reassign": {
      const { task, to } = request;
      const asLead = leads(actor, task.groupId) && to.groupId === task.groupId;
      const allowed =
        holds(actor, "reassignTasks") || asLead || madeOneOff(actor, task);
      return all(
        allowed ? null : "missingPermission",
        rankAtOrBelow(actor, subjectRank(task)),
        rankAtOrBelow(actor, to.rank),
        to.memberId === null || to.eligible ? null : "notEligible",
      );
    }
    case "task.approve": {
      const { task } = request;
      return all(
        holds(actor, "approveTasks") || leads(actor, task.groupId)
          ? null
          : "missingPermission",
        task.awaitingReview ? null : "notWaiting",
        task.sentForReviewBy === actor.id || task.memberId === actor.id
          ? "ownWork"
          : null,
        rankAtOrBelow(actor, task.ranks.doer ?? task.ranks.maker),
      );
    }
    case "task.delete": {
      const { task } = request;
      if (task.event !== null)
        return plansEventOf(actor, task) ? yes : no("missingPermission");
      return all(
        holds(actor, "editAnyTask") || madeOneOff(actor, task)
          ? null
          : "missingPermission",
        rankAtOrBelow(actor, subjectRank(task)),
      );
    }
    case "task.createOneOff":
      return all(need(actor, "createStandaloneTasks"));
    case "task.createInEvent":
      return all(
        need(actor, "planEvents"),
        canSeeEvent(actor, request.event) ? null : "cantSeeEvent",
        rankAtOrBelow(actor, request.event.ownerRank),
      );
    // #endregion

    // #region Events
    case "event.view":
      return canSeeEvent(actor, request.event) ? yes : no("cantSeeEvent");
    case "event.create":
      return all(need(actor, "planEvents"));
    case "event.edit":
    case "event.delete":
      return all(
        need(actor, "planEvents"),
        canSeeEvent(actor, request.event) ? null : "cantSeeEvent",
        rankAtOrBelow(actor, request.event.ownerRank),
      );
    case "event.reply":
      return all(
        request.asksReply ? null : "outOfScope",
        isInEvent(actor, request.event) ? null : "outOfScope",
      );
    case "event.remind":
      return all(
        need(actor, "planEvents"),
        canSeeEvent(actor, request.event) ? null : "cantSeeEvent",
      );
    // #endregion

    // #region Workflows and fields
    case "workflow.edit":
    case "field.create":
    case "field.edit":
    case "field.delete":
      return all(need(actor, "editWorkflows"));
    case "workflow.namePerson":
      return all(
        need(actor, "editWorkflows"),
        rankAtOrBelow(actor, request.personRank),
      );
    // #endregion

    // #region Groups
    case "group.manage":
    case "group.setLeads":
    case "group.settings":
      return all(need(actor, "manageWorkGroups"));
    case "group.addMember":
      return holds(actor, "manageWorkGroups") || holds(actor, "manageMembers")
        ? yes
        : no("missingPermission");
    case "group.removeMember":
      return all(
        holds(actor, "manageWorkGroups") || holds(actor, "manageMembers")
          ? null
          : "missingPermission",
        rankBelow(actor, request.memberRank),
      );
    case "group.setTakesTasks":
      return holds(actor, "manageWorkGroups") || leads(actor, request.groupId)
        ? yes
        : no("missingPermission");
    // #endregion

    // #region People
    case "member.invite":
      return all(
        need(actor, "manageMembers"),
        ...request.roles.map((role) => managesRole(actor, role)),
        ...request.roles.map((role) => holdsAll(actor, role.permissions)),
      );
    case "member.rename":
    case "member.setAccess":
    case "member.remove":
      return all(
        need(actor, "manageMembers"),
        rankBelow(actor, request.memberRank),
      );
    case "member.setRoles":
      return all(
        holds(actor, "manageMembers") || holds(actor, "manageRoles")
          ? null
          : "missingPermission",
        rankBelow(actor, request.memberRank),
        ...[...request.added, ...request.removed].map((role) =>
          managesRole(actor, role),
        ),
        ...request.added.map((role) => holdsAll(actor, role.permissions)),
      );
    case "member.tag":
      return holds(actor, "tagPeople") || holds(actor, "manageMembers")
        ? yes
        : no("missingPermission");
    case "member.removePhoto":
      if (request.memberId === actor.id) return yes;
      return all(
        need(actor, "administrator"),
        rankBelow(actor, request.memberRank),
      );
    // #endregion

    // #region Roles and Owners
    case "role.create":
      return all(
        need(actor, "manageRoles"),
        rankBelow(actor, request.position),
        holdsAll(actor, request.permissions),
      );
    case "role.edit":
      // Everyone sits at 0 under every role: anyone who manages roles can
      // change what it allows (within what they hold), never move it.
      if (request.role.id === "everyone")
        return all(
          need(actor, "manageRoles"),
          request.position === 0 ? null : "protectedRole",
          holdsAll(actor, request.changed),
        );
      return all(
        need(actor, "manageRoles"),
        managesRole(actor, request.role),
        rankBelow(actor, request.position),
        holdsAll(actor, request.changed),
      );
    case "role.delete":
      return all(
        need(actor, "manageRoles"),
        managesRole(actor, request.role),
        holdsAll(actor, request.role.permissions),
      );
    case "role.reorder":
      return all(
        need(actor, "manageRoles"),
        ...request.moves.flatMap((move) => [
          rankBelow(actor, move.from),
          rankBelow(actor, move.to),
        ]),
      );
    case "owner.give":
      return actor.isOwner ? yes : no("ownerOnly");
    case "owner.stepDown":
      return all(
        actor.isOwner ? null : "ownerOnly",
        request.otherOwners > 0 ? null : "lastOwner",
      );
    // #endregion

    // #region Settings
    case "settings.workspace":
    case "settings.taskSetup":
      return all(need(actor, "manageSettings"));
    case "settings.admin":
      return all(need(actor, "administrator"));
    // #endregion
  }
}
