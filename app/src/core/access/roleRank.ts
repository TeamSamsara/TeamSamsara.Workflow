// File : /TeamSamsara.Workflow/app/src/core/access/roleRank.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Role order decides who manages whom: a member may edit, give and take
// away only the roles below their own highest one. Administrators manage every
// role. Everyone can be edited but never deleted or given away.

import { EveryoneRoleId, type RoleRecord, type RolesRecord } from "@/core/data";
import { heldRoleIds, resolvePermissions } from "./resolvePermissions";

/** The position of the member's highest role (0 when they only have Everyone). */
export function highestPosition(
  memberRoleIds: readonly string[],
  roles: RolesRecord,
): number {
  const held = heldRoleIds(memberRoleIds, roles);
  return Math.max(
    0,
    ...roles.roles
      .filter((role) => held.has(role.id))
      .map((role) => role.position),
  );
}

export function canManageRole(
  memberRoleIds: readonly string[],
  target: RoleRecord,
  roles: RolesRecord,
): boolean {
  if (resolvePermissions(memberRoleIds, roles).has("administrator"))
    return true;
  return target.position < highestPosition(memberRoleIds, roles);
}

/** Roles this member may hand out: the ones they manage, never Everyone. */
export function assignableRoles(
  memberRoleIds: readonly string[],
  roles: RolesRecord,
): RoleRecord[] {
  return roles.roles.filter(
    (role) =>
      role.id !== EveryoneRoleId && canManageRole(memberRoleIds, role, roles),
  );
}
