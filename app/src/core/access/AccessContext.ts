// File : /TeamSamsara.Workflow/app/src/core/access/AccessContext.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : The context that shares what the signed-in member may do, worked out
// once by AccessProvider. Context only; the hooks that read it are usePermissions
// and useCan.

import { createContext } from "react";
import type { RolesRecord } from "@/core/data";
import type { PermissionKey } from "./permissionKeys";

export interface AccessState {
  /** loading: the roles aren't in yet, so nothing is allowed until they are. */
  status: "loading" | "ready";
  permissions: ReadonlySet<PermissionKey>;
  /** Every role, highest first; null until loaded. */
  roles: RolesRecord | null;
  /** The roles the signed-in member holds (not counting Everyone). */
  memberRoleIds: readonly string[];
  can: (permission: PermissionKey) => boolean;
  canAny: (permissions: readonly PermissionKey[]) => boolean;
}

export const AccessContext = createContext<AccessState | undefined>(undefined);
