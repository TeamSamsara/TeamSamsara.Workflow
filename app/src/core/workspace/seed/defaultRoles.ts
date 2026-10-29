// File : /TeamSamsara.Workflow/app/src/core/workspace/seed/defaultRoles.ts
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : The two roles every new workspace starts with: Everyone (see
// everything, do the tasks assigned to you) and Admin (Administrator). Admins
// rename, recolour or add to them afterwards. Data only, with type-only imports,
// so scripts/seedEmulator.mjs can load this file as it is.

import type { PermissionKey } from "@/core/access";
import type { EveryoneRoleId, RoleRecord } from "@/core/data";

/** The role the person who sets up the workspace gets. */
export const AdminRoleId = "admin";

interface DefaultRole extends RoleRecord {
  permissions: PermissionKey[];
}

export const defaultRoles: readonly DefaultRole[] = [
  {
    id: "everyone" satisfies typeof EveryoneRoleId,
    name: "Everyone",
    color: "#8A8F94",
    description: "Every member has this role.",
    position: 0,
    permissions: ["viewAll", "doAssignedTasks"],
  },
  {
    id: AdminRoleId,
    name: "Admin",
    color: "#E5484D",
    description: "Can do everything.",
    position: 1,
    permissions: ["administrator"],
  },
];
