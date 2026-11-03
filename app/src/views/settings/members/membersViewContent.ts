// File : /TeamSamsara.Workflow/app/src/views/settings/members/membersViewContent.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The words on the Members settings page.

import type { StatusFilter } from "@/features/members";

export const MembersViewText = {
  title: "Members",
  description:
    "Everyone who can sign in to this workspace. Only people you invite can join.",
  invite: "Invite people",
  search: "Search by name or email",
  filterLabel: "Filter by status",
  filters: {
    all: "All",
    active: "Active",
    invited: "Invited",
    disabled: "Disabled",
  } satisfies Record<StatusFilter, string>,
  filterWithCount: (label: string, count: number) => `${label} ${count}`,
  loading: "Loading members",
} as const;
