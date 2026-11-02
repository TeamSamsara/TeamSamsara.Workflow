// File : /TeamSamsara.Workflow/app/src/features/events/types/audience.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Who's in an event or a repeat: Everyone, work groups and people.
// Only they (plus whoever made it and View all) can see it.

import type { DocumentData } from "firebase/firestore";
import { readBoolean, readStringList } from "@/core/data";

export interface Audience {
  everyone: boolean;
  groupIds: string[];
  memberIds: string[];
}

/** Sizes the app keeps to (firestore.rules checks the same). */
export const AudienceLimits = { groups: 20, members: 50 } as const;

export const nobody: Audience = {
  everyone: false,
  groupIds: [],
  memberIds: [],
};

/** Saved events made before people could be added were for everyone. */
export function readAudience(data: DocumentData): Audience {
  return {
    everyone:
      data.everyone === undefined ? true : readBoolean(data, "everyone"),
    groupIds: readStringList(data, "groupIds"),
    memberIds: readStringList(data, "memberIds"),
  };
}

export function audienceData(audience: Audience): Audience {
  return {
    everyone: audience.everyone,
    groupIds: [...new Set(audience.groupIds)].slice(0, AudienceLimits.groups),
    memberIds: [...new Set(audience.memberIds)].slice(
      0,
      AudienceLimits.members,
    ),
  };
}

export function isEmptyAudience(audience: Audience): boolean {
  return (
    !audience.everyone &&
    audience.groupIds.length === 0 &&
    audience.memberIds.length === 0
  );
}

/** Whether this event involves the member, personally or through a work group. */
export function involves(
  audience: Audience,
  member: { id: string; workGroupIds: readonly string[] } | null,
): boolean {
  if (!member) return false;
  return (
    audience.memberIds.includes(member.id) ||
    audience.groupIds.some((groupId) => member.workGroupIds.includes(groupId))
  );
}
