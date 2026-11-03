// File : /TeamSamsara.Workflow/app/src/features/roles/hooks/useRole.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : One role from the live list, by id, with its member count and
// whether you may manage it. undefined while loading, null when there is no
// such role (deleted, or a mistyped address).

import { useRoleList } from "./useRoleList";
import type { RoleListItem } from "../types/roleTypes";

export function useRole(
  roleId: string | undefined,
): RoleListItem | null | undefined {
  const list = useRoleList();
  if (list.status === "loading") return undefined;
  return list.items.find((item) => item.role.id === roleId) ?? null;
}
