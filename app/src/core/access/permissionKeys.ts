// File : /TeamSamsara.Workflow/app/src/core/access/permissionKeys.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : The built-in permissions. Like the platform list, these live in code:
// the security rules check them by name, so they can't be data. Roles (which
// permissions to switch on, for whom) are data.

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
] as const;

export type PermissionKey = (typeof PermissionKeys)[number];

export function isPermissionKey(value: string): value is PermissionKey {
  return PermissionKeys.some((key) => key === value);
}
