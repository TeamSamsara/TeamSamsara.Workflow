// File : /TeamSamsara.Workflow/app/src/core/access/RequirePermission.tsx
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Route guard for pages that need a permission. While the roles load it
// waits; without the permission it shows the fallback (the Forbidden page, given
// by the router) at the same address.

import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { SessionLoading } from "@/core/session";
import type { PermissionKey } from "./permissionKeys";
import { usePermissions } from "./usePermissions";

interface RequirePermissionProps {
  /** Any one of these opens the page. */
  anyOf: readonly PermissionKey[];
  fallback: ReactNode;
}

export function RequirePermission({ anyOf, fallback }: RequirePermissionProps) {
  const access = usePermissions();
  if (access.status === "loading") return <SessionLoading />;
  return access.canAny(anyOf) ? <Outlet /> : <>{fallback}</>;
}
