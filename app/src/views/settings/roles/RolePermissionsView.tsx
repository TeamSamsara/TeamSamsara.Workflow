// File : /TeamSamsara.Workflow/app/src/views/settings/roles/RolePermissionsView.tsx
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : A role's Permissions tab: the grouped switches, locked where the
// editor may not change them, and the whole list read-only for a role at or
// above their own.

import { NotForEveryone, type PermissionKey } from "@/core/access";
import { canChangePermission, PermissionList } from "@/features/roles";
import { useRoleEditor } from "./roleEditorContext";

export function RolePermissionsView() {
  const { item, draft, list } = useRoleEditor();

  const canChange = (permission: PermissionKey) =>
    !(item.isEveryone && NotForEveryone.includes(permission)) &&
    canChangePermission(permission, list.editor);

  return (
    <PermissionList
      selected={draft.fields.permissions}
      onChange={draft.setPermission}
      onClearAll={() =>
        draft.clearPermissions((permission) => !canChange(permission))
      }
      canChange={canChange}
      isEveryone={item.isEveryone}
      readOnly={!item.canManage || draft.isSaving}
    />
  );
}
