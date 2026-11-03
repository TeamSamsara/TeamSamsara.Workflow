// File : /TeamSamsara.Workflow/app/src/features/roles/types/roleTypes.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Roles as the role screens use them: what can be edited, and each
// role in the list with how many members hold it and whether you may manage it.

import type { PermissionKey } from "@/core/access";
import type { RoleRecord } from "@/core/data";

/** The editable part of a role. */
export interface RoleFields {
  name: string;
  color: string;
  description: string;
  permissions: PermissionKey[];
}

export interface RoleListItem {
  role: RoleRecord;
  isEveryone: boolean;
  /** Members holding it; null while the member list loads. Everyone counts as all. */
  memberCount: number | null;
  /** Whether the signed-in member may edit, move or delete it. */
  canManage: boolean;
}
