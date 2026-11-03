// File : /TeamSamsara.Workflow/app/src/core/access/AccessProvider.tsx
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Works out the signed-in member's permissions once for the whole app,
// from their roles and the live roles document, so a role change applies on
// screen straight away. Signed out or without access, nothing is allowed.

import { useMemo, type ReactNode } from "react";
import {
  Collections,
  ConfigDocuments,
  rolesConverter,
  useLiveDocument,
} from "@/core/data";
import { useSession } from "@/core/session";
import { AccessContext, type AccessState } from "./AccessContext";
import type { PermissionKey } from "./permissionKeys";
import { resolvePermissions } from "./resolvePermissions";

const rolesPath = `${Collections.config}/${ConfigDocuments.roles}`;
const noPermissions: ReadonlySet<PermissionKey> = new Set();
const noRoleIds: readonly string[] = [];

interface AccessProviderProps {
  children: ReactNode;
}

export function AccessProvider({ children }: AccessProviderProps) {
  const session = useSession();
  const isActive = session.status === "active";
  const memberRoleIds = isActive ? session.member.roleIds : noRoleIds;
  const roles = useLiveDocument(isActive ? rolesPath : null, rolesConverter);

  const state = useMemo<AccessState>(() => {
    const record = roles.status === "ready" ? (roles.data ?? null) : null;
    const permissions = record
      ? resolvePermissions(memberRoleIds, record)
      : noPermissions;
    const isLoading = isActive && roles.status !== "ready";
    return {
      status: isLoading ? "loading" : "ready",
      permissions,
      roles: record,
      memberRoleIds,
      can: (permission) => permissions.has(permission),
      canAny: (wanted) =>
        wanted.some((permission) => permissions.has(permission)),
    };
  }, [roles, memberRoleIds, isActive]);

  return <AccessContext value={state}>{children}</AccessContext>;
}
