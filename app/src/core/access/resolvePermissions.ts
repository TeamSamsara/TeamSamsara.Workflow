// File : /TeamSamsara.Workflow/app/src/core/access/resolvePermissions.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Works out what a member may do, the way Discord does: the Everyone
// role's permissions, plus every permission of every role they hold. Roles only
// add, never take away, and Administrator means everything.

import { EveryoneRoleId, type RolesRecord } from "@/core/data";
import {
  isPermissionKey,
  PermissionKeys,
  type PermissionKey,
} from "./permissionKeys";

/** The roles that apply to a member: Everyone, plus the ones they hold that exist. */
export function heldRoleIds(
  memberRoleIds: readonly string[],
  roles: RolesRecord,
): Set<string> {
  const existing = new Set(roles.roles.map((role) => role.id));
  return new Set(
    [EveryoneRoleId, ...memberRoleIds].filter((id) => existing.has(id)),
  );
}

export function resolvePermissions(
  memberRoleIds: readonly string[],
  roles: RolesRecord,
): ReadonlySet<PermissionKey> {
  const held = heldRoleIds(memberRoleIds, roles);
  const granted = new Set<PermissionKey>();

  for (const role of roles.roles) {
    if (!held.has(role.id)) continue;
    for (const permission of role.permissions) {
      // A permission the app doesn't know (an old or mistyped one) grants nothing.
      if (isPermissionKey(permission)) granted.add(permission);
    }
  }

  return granted.has("administrator") ? new Set(PermissionKeys) : granted;
}
