// File : /TeamSamsara.Workflow/app/src/features/roles/service/roleChanges.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The changes the role screens make, as pure functions over the list
// of roles: add, edit, reorder, delete. Each returns a new list with positions
// renumbered (top role highest, Everyone always 0). Saving the list rebuilds
// the permission index (serializeRoles), so the two can't disagree.

import {
  NotForEveryone,
  PermissionKeys,
  type PermissionKey,
} from "@/core/access";
import { EveryoneRoleId, sortRoles, type RoleRecord } from "@/core/data";
import type { RoleFields } from "../types/roleTypes";

/** Permissions in catalogue order, without repeats or unknown keys. */
export function tidyPermissions(
  permissions: readonly string[],
): PermissionKey[] {
  return PermissionKeys.filter((key) => permissions.includes(key));
}

/** Gives the roles (top first) positions n…1, with Everyone at 0. */
export function renumber(orderedRoles: readonly RoleRecord[]): RoleRecord[] {
  const others = orderedRoles.filter((role) => role.id !== EveryoneRoleId);
  const everyone = orderedRoles.filter((role) => role.id === EveryoneRoleId);
  return [
    ...others.map((role, index) => ({
      ...role,
      position: others.length - index,
    })),
    ...everyone.map((role) => ({ ...role, position: 0 })),
  ];
}

/** A new role goes at the bottom, just above Everyone, like in Discord. */
export function addRole(
  roles: readonly RoleRecord[],
  id: string,
  fields: RoleFields,
): RoleRecord[] {
  const ordered = sortRoles(roles);
  const everyoneIndex = ordered.findIndex((role) => role.id === EveryoneRoleId);
  const insertAt = everyoneIndex === -1 ? ordered.length : everyoneIndex;
  const created: RoleRecord = {
    id,
    name: fields.name.trim(),
    color: fields.color,
    description: fields.description.trim(),
    position: 0,
    permissions: tidyPermissions(fields.permissions),
  };
  return renumber([
    ...ordered.slice(0, insertAt),
    created,
    ...ordered.slice(insertAt),
  ]);
}

/**
 * Saves a role's fields. Everyone keeps its name, and never gets a permission
 * it may not hold.
 */
export function updateRole(
  roles: readonly RoleRecord[],
  id: string,
  fields: RoleFields,
): RoleRecord[] {
  return renumber(
    sortRoles(roles).map((role) => {
      if (role.id !== id) return role;
      if (role.id === EveryoneRoleId) {
        return {
          ...role,
          permissions: tidyPermissions(fields.permissions).filter(
            (permission) => !NotForEveryone.includes(permission),
          ),
        };
      }
      return {
        ...role,
        name: fields.name.trim(),
        color: fields.color,
        description: fields.description.trim(),
        permissions: tidyPermissions(fields.permissions),
      };
    }),
  );
}

/** Puts the roles in this order (top first). Ids it doesn't list keep their place below. */
export function reorderRoles(
  roles: readonly RoleRecord[],
  orderedIds: readonly string[],
): RoleRecord[] {
  const byId = new Map(roles.map((role) => [role.id, role]));
  const listed = orderedIds
    .map((roleId) => byId.get(roleId))
    .filter((role): role is RoleRecord => role !== undefined);
  const rest = sortRoles(roles).filter((role) => !orderedIds.includes(role.id));
  return renumber([...listed, ...rest]);
}

/** Removes a role. Everyone can't be removed. */
export function removeRole(
  roles: readonly RoleRecord[],
  id: string,
): RoleRecord[] {
  if (id === EveryoneRoleId) return renumber(sortRoles(roles));
  return renumber(sortRoles(roles).filter((role) => role.id !== id));
}
