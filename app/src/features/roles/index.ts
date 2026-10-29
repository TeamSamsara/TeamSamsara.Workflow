// File : /TeamSamsara.Workflow/app/src/features/roles/index.ts
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : What other layers may use from the roles feature.

export { useRole } from "./hooks/useRole";
export { useRoleDraft } from "./hooks/useRoleDraft";
export type { RoleDraft } from "./hooks/useRoleDraft";
export { useRoleList } from "./hooks/useRoleList";
export type { RoleList as RoleListState } from "./hooks/useRoleList";
export {
  canChangePermission,
  deleteBlocker,
  givableRoles,
  isLastAdministratorRole,
} from "./service/roleAccess";
export type { DeleteBlocker, RoleEditor } from "./service/roleAccess";
export { giveRole, saveRoleOrder, takeRole } from "./service/roleService";
export type { RoleFields, RoleListItem } from "./types/roleTypes";
export { DeleteRoleDialog } from "./ui/DeleteRoleDialog";
export { NewRoleDialog } from "./ui/NewRoleDialog";
export { PermissionList } from "./ui/PermissionList";
export { RoleChip } from "./ui/RoleChip";
export { RoleDisplayForm } from "./ui/RoleDisplayForm";
export { DeleteRoleText } from "./ui/roleDialogsContent";
export { RoleList } from "./ui/RoleList";
export { RolePicker } from "./ui/RolePicker";
