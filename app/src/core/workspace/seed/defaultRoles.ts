// File : /TeamSamsara.Workflow/app/src/core/workspace/seed/defaultRoles.ts
// Version : 1.2.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The roles every new workspace starts with: Everyone (do the
// tasks given to you; see the events you're in), Admin (Administrator) and
// Owner, above every other role, which the person who sets it up gets.
// Admins rename, recolour or add to Everyone and Admin afterwards. Data only, with type-only imports,
// so scripts/seedEmulator.mjs can load this file as it is.

import type { PermissionKey } from "@/core/access";
import type { EveryoneRoleId, RoleRecord } from "@/core/data";

export const AdminRoleId = "admin";

/** The role the person who sets up the workspace gets: above every other. */
export const OwnerRoleId = "owner";

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
    permissions: ["doAssignedTasks"],
  },
  {
    id: AdminRoleId,
    name: "Admin",
    color: "#E5484D",
    description: "Can do everything.",
    position: 1,
    permissions: ["administrator"],
  },
  {
    id: OwnerRoleId,
    name: "Owner",
    color: "#151D23",
    description: "Above every other role. Only Owners make someone an Owner.",
    position: 1_000_000,
    permissions: ["administrator"],
  },
];
