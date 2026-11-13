// File : /TeamSamsara.Workflow/app/src/core/access/index.ts
// Version : 1.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : What other layers may use from the access module.

export type { AccessState } from "./AccessContext";
export { AccessProvider } from "./AccessProvider";
export { Can } from "./Can";
export {
  ManagePermissions,
  NotForEveryone,
  PermissionGroups,
  permissionsByGroup,
} from "./permissionCatalogue";
export type { PermissionGroup } from "./permissionCatalogue";
export { PermissionGroupText, PermissionText } from "./permissionContent";
export { isPermissionKey, PermissionKeys } from "./permissionKeys";
export type { PermissionKey } from "./permissionKeys";
export { RequirePermission } from "./RequirePermission";
export { heldRoleIds, resolvePermissions } from "./resolvePermissions";
export { assignableRoles, canManageRole, highestPosition } from "./roleRank";
export { manage, manageRefusal } from "./manageService";
export type { ManageOp, ManageRefusal, RoleToSave } from "./manageService";
export { useCan } from "./useCan";
export { usePermissions } from "./usePermissions";
