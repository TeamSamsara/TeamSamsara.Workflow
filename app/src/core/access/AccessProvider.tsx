// File : /TeamSamsara.Workflow/app/src/core/access/AccessProvider.tsx
// Version : 1.1.0
// Latest commit: feature/1.2-view-as-role
// Author : Gerrah
// Purpose : Works out the signed-in member's permissions once for the whole app,
// from their roles and the live roles document, so a role change applies on
// screen straight away. Signed out or without access, nothing is allowed.
// Also View as this role: someone who manages roles sees the app with only
// a role below theirs, until they stop (remembered for this browser tab).

import { useCallback, useMemo, useState, type ReactNode } from "react";
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
import { viewableRole } from "./roleRank";

const viewingKey = "playbook.viewingAs";

function readViewing(): string | null {
  try {
    return sessionStorage.getItem(viewingKey);
  } catch {
    return null;
  }
}

function storeViewing(roleId: string | null) {
  try {
    if (roleId) sessionStorage.setItem(viewingKey, roleId);
    else sessionStorage.removeItem(viewingKey);
  } catch {
    // Not kept across reloads where storage is off; still works for now.
  }
}

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
  const [viewing, setViewing] = useState<string | null>(readViewing);
  const viewAs = useCallback((roleId: string) => {
    storeViewing(roleId);
    setViewing(roleId);
  }, []);
  const stopViewing = useCallback(() => {
    storeViewing(null);
    setViewing(null);
  }, []);

  const state = useMemo<AccessState>(() => {
    const record = roles.status === "ready" ? (roles.data ?? null) : null;
    const realPermissions = record
      ? resolvePermissions(memberRoleIds, record)
      : noPermissions;
    // Only a role that still exists, below theirs, for someone who manages roles.
    const viewingAs = record
      ? viewableRole(viewing, memberRoleIds, realPermissions, record)
      : null;
    const roleIds = viewingAs ? [viewingAs] : memberRoleIds;
    const permissions =
      record && viewingAs
        ? resolvePermissions(roleIds, record)
        : realPermissions;
    const isLoading = isActive && roles.status !== "ready";
    return {
      status: isLoading ? "loading" : "ready",
      permissions,
      roles: record,
      memberRoleIds: roleIds,
      can: (permission) => permissions.has(permission),
      canAny: (wanted) =>
        wanted.some((permission) => permissions.has(permission)),
      viewingAs,
      viewAs,
      stopViewing,
    };
  }, [roles, memberRoleIds, isActive, viewing, viewAs, stopViewing]);

  return <AccessContext value={state}>{children}</AccessContext>;
}
