// File : /TeamSamsara.Workflow/app/src/core/access/Can.tsx
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Shows its children only when the signed-in member holds a permission
// (or any one of several). Hiding is a courtesy: the security rules refuse the
// action anyway.

import type { ReactNode } from "react";
import type { PermissionKey } from "./permissionKeys";
import { usePermissions } from "./usePermissions";

interface CanProps {
  /** One permission, or a list where any one is enough. */
  permission: PermissionKey | readonly PermissionKey[];
  children: ReactNode;
  /** Shown instead when the permission is missing. Nothing by default. */
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { canAny } = usePermissions();
  const wanted = typeof permission === "string" ? [permission] : permission;
  return <>{canAny(wanted) ? children : fallback}</>;
}
