// File : /TeamSamsara.Workflow/app/src/core/access/roleRank.ts
// Version : 2.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Role order decides who manages whom, the same as the shared
// permission model and the server: a member edits, gives and takes away only
// the roles strictly below their own highest one, Administrators included.
// Owners sit above every role; nobody edits, moves or hands out the Owner
// role through roles (only an Owner makes someone an Owner). Everyone can be
// edited but never moved, deleted or given away.

import { OwnerRoleId, rankOf } from "@engine/access/index";
import { EveryoneRoleId, type RoleRecord, type RolesRecord } from "@/core/data";

/** Their rank: the position of their highest role, Owners above all. */
export function highestPosition(
  memberRoleIds: readonly string[],
  roles: RolesRecord,
): number {
  return rankOf(memberRoleIds, roles.roles);
}

export function canManageRole(
  memberRoleIds: readonly string[],
  target: RoleRecord,
  roles: RolesRecord,
): boolean {
  if (target.id === OwnerRoleId) return false;
  if (target.id === EveryoneRoleId) return true;
  return target.position < highestPosition(memberRoleIds, roles);
}

/** Roles this member may hand out: the ones they manage, never Everyone or Owner. */
export function assignableRoles(
  memberRoleIds: readonly string[],
  roles: RolesRecord,
): RoleRecord[] {
  return roles.roles.filter(
    (role) =>
      role.id !== EveryoneRoleId && canManageRole(memberRoleIds, role, roles),
  );
}
