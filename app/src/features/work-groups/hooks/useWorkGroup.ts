// File : /TeamSamsara.Workflow/app/src/features/work-groups/hooks/useWorkGroup.ts
// Version : 1.0.0
// Latest commit: feature/work-groups
// Author : Gerrah
// Purpose : One work group from the live list, by id. undefined while loading,
// null when there is no such group (deleted, or a mistyped address).

import type { WorkGroupListItem } from "../types/workGroupTypes";
import { useWorkGroups } from "./useWorkGroups";

export function useWorkGroup(
  groupId: string | undefined,
): WorkGroupListItem | null | undefined {
  const list = useWorkGroups();
  if (list.status === "loading") return undefined;
  return list.items.find((item) => item.group.id === groupId) ?? null;
}
