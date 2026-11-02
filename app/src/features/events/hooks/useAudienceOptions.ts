// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useAudienceOptions.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : The work groups and people that can be put in an event, by name,
// with how many people each group has.

import { useMemo } from "react";
import { isCurrentMember } from "@/core/data";
import { memberName, useMembers } from "@/features/members";
import { useWorkGroups } from "@/features/work-groups";
import type { AudienceGroupOption, AudienceOption } from "../ui/AudiencePicker";

export interface AudienceOptions {
  groups: AudienceGroupOption[];
  members: AudienceOption[];
}

export function useAudienceOptions(): AudienceOptions {
  const groups = useWorkGroups();
  const members = useMembers();
  return useMemo(() => {
    const current = members.records.filter(isCurrentMember);
    return {
      groups: groups.items
        .map((item) => ({
          id: item.group.id,
          name: item.group.name,
          size:
            item.members?.filter(isCurrentMember).length ??
            current.filter((member) =>
              member.workGroupIds.includes(item.group.id),
            ).length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      members: current
        .map((member) => ({ id: member.id, name: memberName(member) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [groups.items, members.records]);
}
