// File : /TeamSamsara.Workflow/app/src/views/settings/roles/roleEditorContext.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : What the Roles page hands its Display and Permissions tabs: the
// open role, its unsaved draft, and the list (for the editor's reach).

import { useOutletContext } from "react-router-dom";
import type { RoleDraft, RoleListItem, RoleListState } from "@/features/roles";

export interface RoleEditorContext {
  item: RoleListItem;
  draft: RoleDraft;
  list: RoleListState;
}

export function useRoleEditor(): RoleEditorContext {
  return useOutletContext<RoleEditorContext>();
}
