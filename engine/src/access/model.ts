// File : /TeamSamsara.Workflow/engine/src/access/model.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The pieces every permission check is made of, the same in the
// app, the server functions and the tests the database rules are held to:
// the built-in permissions, the Owner and Everyone roles, rank (the position
// of someone's highest role, Owners above everything), and who is acting.

/** The built-in permissions. The database rules check them by name. */
export const PermissionKeys = [
  "administrator",
  "manageSettings",
  "manageMembers",
  "manageRoles",
  "manageWorkGroups",
  "editWorkflows",
  "planEvents",
  "createStandaloneTasks",
  "doAssignedTasks",
  "editAnyTask",
  "approveTasks",
  "reassignTasks",
  "viewAll",
  "viewAvailability",
  "tagPeople",
] as const;

export type PermissionKey = (typeof PermissionKeys)[number];

export function isPermissionKey(value: string): value is PermissionKey {
  return PermissionKeys.some((key) => key === value);
}

/** The role every member has. It always sits at the bottom, at 0. */
export const EveryoneRoleId = "everyone";

/**
 * The role above every other. Owners can do everything, nobody outranks
 * them, and only an Owner gives the role. There can be several.
 */
export const OwnerRoleId = "owner";

/** An Owner's rank: above any position a role can have. */
export const OwnerRank = 1_000_000;

/** As much of a role as rank and permissions need. */
export interface RoleForAccess {
  id: string;
  /** Higher ranks higher. Everyone is 0. */
  position: number;
  permissions: readonly string[];
}

export type MemberStatus = "active" | "invited" | "disabled" | "removed";

/** Who is acting, worked out once from their member record and the roles. */
export interface Actor {
  id: string;
  status: MemberStatus;
  permissions: ReadonlySet<PermissionKey>;
  /** The position of their highest role; OwnerRank for an Owner. */
  rank: number;
  isOwner: boolean;
  /** The work groups they're in. */
  groupIds: readonly string[];
  /** The work groups they lead (always a subset of groupIds once migrated). */
  leadOf: readonly string[];
}

/** The roles that apply to someone: Everyone, plus the ones they hold that exist. */
export function heldRoles(
  roleIds: readonly string[],
  roles: readonly RoleForAccess[],
): RoleForAccess[] {
  const held = new Set([EveryoneRoleId, ...roleIds]);
  return roles.filter((role) => held.has(role.id));
}

/**
 * Rank: the position of the highest role held. Owners rank above everything;
 * with several roles only the highest counts; with none, 0.
 */
export function rankOf(
  roleIds: readonly string[],
  roles: readonly RoleForAccess[],
): number {
  if (roleIds.includes(OwnerRoleId)) return OwnerRank;
  return Math.max(
    0,
    ...heldRoles(roleIds, roles).map((role) =>
      role.id === EveryoneRoleId ? 0 : role.position,
    ),
  );
}

/** Every permission a set of roles switches on; Owner and Administrator mean all. */
export function permissionsOf(
  roleIds: readonly string[],
  roles: readonly RoleForAccess[],
): ReadonlySet<PermissionKey> {
  if (roleIds.includes(OwnerRoleId)) return new Set(PermissionKeys);
  const granted = new Set<PermissionKey>();
  for (const role of heldRoles(roleIds, roles))
    for (const permission of role.permissions)
      if (isPermissionKey(permission)) granted.add(permission);
  return granted.has("administrator") ? new Set(PermissionKeys) : granted;
}

/** As much of a member record as an actor needs. */
export interface MemberForAccess {
  id: string;
  status: MemberStatus;
  roleIds: readonly string[];
  workGroupIds: readonly string[];
}

/** Who is acting, from their record, the roles, and the groups they lead. */
export function actorOf(
  member: MemberForAccess,
  roles: readonly RoleForAccess[],
  leadOf: readonly string[],
): Actor {
  return {
    id: member.id,
    status: member.status,
    permissions: permissionsOf(member.roleIds, roles),
    rank: rankOf(member.roleIds, roles),
    isOwner: member.roleIds.includes(OwnerRoleId),
    groupIds: member.workGroupIds,
    leadOf,
  };
}

/** Signed in with access: invited people activate on their first sign-in. */
export const canAct = (actor: Actor) =>
  actor.status === "active" || actor.status === "invited";

export const holds = (actor: Actor, permission: PermissionKey) =>
  canAct(actor) && actor.permissions.has(permission);

/** At your rank or below: tasks and events. */
export const atOrBelow = (actor: Actor, subjectRank: number) =>
  subjectRank <= actor.rank;

/** Strictly below: people, roles and access. Never yourself, never an equal. */
export const strictlyBelow = (actor: Actor, subjectRank: number) =>
  subjectRank < actor.rank;
