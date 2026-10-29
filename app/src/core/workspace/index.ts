// File : /TeamSamsara.Workflow/app/src/core/workspace/index.ts
// Version : 1.1.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : What other layers may use from the workspace module.

export { RequireWorkspace } from "./RequireWorkspace";
export { AdminRoleId, defaultRoles } from "./seed/defaultRoles";
export { setUpWorkspace } from "./setupService";
export type { SetupAccount, SetupDetails } from "./setupService";
export { useWorkspace, useWorkspaceRecord } from "./useWorkspace";
export { WorkspaceProvider } from "./WorkspaceProvider";
export { updateWorkspace } from "./workspaceService";
export type { WorkspaceChanges } from "./workspaceService";
export type { WorkspaceSettings, WorkspaceState } from "./workspaceTypes";
