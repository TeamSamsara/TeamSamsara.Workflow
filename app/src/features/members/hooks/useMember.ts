// File : /TeamSamsara.Workflow/app/src/features/members/hooks/useMember.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : One member from the live list, by id, with roles and groups
// joined. undefined while loading, null when there is no such member here
// (removed, or a mistyped address).

import type { MemberListItem } from "../types/memberTypes";
import { useMembers } from "./useMembers";

export function useMember(
  memberId: string | undefined,
): MemberListItem | null | undefined {
  const list = useMembers();
  if (list.status === "loading") return undefined;
  return list.items.find((item) => item.member.id === memberId) ?? null;
}
