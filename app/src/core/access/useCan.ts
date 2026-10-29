// File : /TeamSamsara.Workflow/app/src/core/access/useCan.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : One question, one answer: may the signed-in member do this?
// `useCan("approveTasks")`. False while the roles are still loading.

import type { PermissionKey } from "./permissionKeys";
import { usePermissions } from "./usePermissions";

export function useCan(permission: PermissionKey): boolean {
  return usePermissions().can(permission);
}
