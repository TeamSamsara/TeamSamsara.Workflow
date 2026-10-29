// File : /TeamSamsara.Workflow/app/src/features/members/service/memberFilters.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The Members page's status filter and search: by status, then by
// name or email (any part, ignoring case and accents), sorted by name.

import type { MemberStatus } from "@/core/data";
import { memberName, type MemberListItem } from "../types/memberTypes";

export const StatusFilters = ["all", "active", "invited", "disabled"] as const;
export type StatusFilter = (typeof StatusFilters)[number];

/** Lower-case and without accents, so "Zoë" matches "zoe". */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesStatus(status: MemberStatus, filter: StatusFilter): boolean {
  return filter === "all" || status === filter;
}

export function filterMembers(
  items: readonly MemberListItem[],
  filter: StatusFilter,
  search: string,
): MemberListItem[] {
  const wanted = fold(search.trim());
  return items
    .filter((item) => matchesStatus(item.member.status, filter))
    .filter(
      (item) =>
        !wanted ||
        fold(item.member.displayName).includes(wanted) ||
        fold(item.member.email).includes(wanted),
    )
    .sort((a, b) => memberName(a.member).localeCompare(memberName(b.member)));
}

/** How many members each filter would show. */
export function countByStatus(
  items: readonly MemberListItem[],
): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    all: 0,
    active: 0,
    invited: 0,
    disabled: 0,
  };
  for (const { member } of items) {
    counts.all += 1;
    if (
      member.status === "active" ||
      member.status === "invited" ||
      member.status === "disabled"
    ) {
      counts[member.status] += 1;
    }
  }
  return counts;
}
