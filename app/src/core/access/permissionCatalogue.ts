// File : /TeamSamsara.Workflow/app/src/core/access/permissionCatalogue.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : How the permissions are grouped and ordered on the Roles page, and
// which of them open Settings.

import type { PermissionKey } from "./permissionKeys";

export const PermissionGroups = [
  "general",
  "workspace",
  "planning",
  "tasks",
  "viewing",
] as const;

export type PermissionGroup = (typeof PermissionGroups)[number];

export const permissionsByGroup: Record<
  PermissionGroup,
  readonly PermissionKey[]
> = {
  general: ["administrator"],
  workspace: [
    "manageSettings",
    "manageMembers",
    "manageRoles",
    "manageWorkGroups",
  ],
  planning: ["editWorkflows", "planEvents", "createStandaloneTasks"],
  tasks: ["doAssignedTasks", "editAnyTask", "approveTasks", "reassignTasks"],
  viewing: ["viewAll"],
};

/** Holding any one of these shows Settings in the menu. */
export const ManagePermissions: readonly PermissionKey[] =
  permissionsByGroup.workspace;

/** Permissions the Everyone role may never switch on. */
export const NotForEveryone: readonly PermissionKey[] = ["administrator"];
