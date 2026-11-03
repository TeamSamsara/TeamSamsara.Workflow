// File : /TeamSamsara.Workflow/app/src/features/roles/service/roleAccess.ts
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : What the signed-in member may do on the role screens, Discord
// style: manage only roles below their own highest one, and switch on or off
// only permissions they hold themselves. Administrators may do everything, and
// only they may hand out Administrator. The security rules check the same
// permission limits, so these only decide what the screen offers.

import {
  assignableRoles,
  canManageRole,
  isPermissionKey,
  type PermissionKey,
} from "@/core/access";
import { EveryoneRoleId, type RoleRecord, type RolesRecord } from "@/core/data";

export interface RoleEditor {
  memberRoleIds: readonly string[];
  /** Everything the member may do, from usePermissions. */
  permissions: ReadonlySet<PermissionKey>;
}

const isAdministrator = (editor: RoleEditor) =>
  editor.permissions.has("administrator");

/** Whether this switch may be flipped on the role being edited. */
export function canChangePermission(
  permission: PermissionKey,
  editor: RoleEditor,
): boolean {
  if (isAdministrator(editor)) return true;
  if (permission === "administrator") return false;
  return editor.permissions.has(permission);
}

/** The only role(s) granting Administrator: deleting the last one would lock everyone out. */
export function isLastAdministratorRole(
  roleId: string,
  roles: RolesRecord,
): boolean {
  const holders = roles.grants.administrator ?? [];
  return holders.length === 1 && holders[0] === roleId;
}

/** Why a role can't be deleted, or null when it can. */
export type DeleteBlocker =
  "everyone" | "notManaged" | "lastAdmin" | "permissions";

export function deleteBlocker(
  role: RoleRecord,
  roles: RolesRecord,
  editor: RoleEditor,
): DeleteBlocker | null {
  if (role.id === EveryoneRoleId) return "everyone";
  if (!canManageRole(editor.memberRoleIds, role, roles)) return "notManaged";
  if (isLastAdministratorRole(role.id, roles)) return "lastAdmin";
  const allHeld = role.permissions.every(
    (permission) =>
      isAdministrator(editor) ||
      editor.permissions.has(permission as PermissionKey),
  );
  return allHeld ? null : "permissions";
}

/**
 * In the list (top first, without Everyone), the first index the member may
 * drag: everything above it is their own level or higher.
 */
export function firstMovableIndex(
  orderedRoles: readonly RoleRecord[],
  roles: RolesRecord,
  editor: RoleEditor,
): number {
  const index = orderedRoles.findIndex((role) =>
    canManageRole(editor.memberRoleIds, role, roles),
  );
  return index === -1 ? orderedRoles.length : index;
}

/**
 * The roles the member may give someone (or take away): below their own
 * highest role, never Everyone, and only roles whose permissions they hold
 * themselves. The security rules refuse anything else.
 */
export function givableRoles(
  roles: RolesRecord,
  editor: RoleEditor,
): RoleRecord[] {
  return assignableRoles(editor.memberRoleIds, roles).filter(
    (role) =>
      isAdministrator(editor) ||
      role.permissions.every(
        (permission) =>
          !isPermissionKey(permission) || editor.permissions.has(permission),
      ),
  );
}
