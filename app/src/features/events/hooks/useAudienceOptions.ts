// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useAudienceOptions.ts
// Version : 1.3.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The work groups and people that can be put in an event, by name,
// with how many people each group has.

import { useMemo } from "react";
import { isCurrentMember } from "@/core/data";
import { memberName, memberSubName, useMembers } from "@/features/members";
import { useWorkGroups } from "@/features/work-groups";
import type { AudienceGroupOption, AudienceOption } from "../ui/AudiencePicker";

export interface AudienceOptions {
  groups: (AudienceGroupOption & { memberIds: string[] })[];
  members: AudienceOption[];
}

export function useAudienceOptions(): AudienceOptions {
  const groups = useWorkGroups();
  const members = useMembers();
  return useMemo(() => {
    const current = members.records.filter(isCurrentMember);
    return {
      groups: groups.items
        .map((item) => {
          const memberIds = (
            item.members?.filter(isCurrentMember) ??
            current.filter((member) =>
              member.workGroupIds.includes(item.group.id),
            )
          ).map((member) => member.id);
          return {
            id: item.group.id,
            name: item.group.name,
            size: memberIds.length,
            memberIds,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
      members: current
        .map((member) => ({
          id: member.id,
          name: memberName(member),
          subName: memberSubName(member),
          photoUrl: member.photoUrl,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [groups.items, members.records]);
}
