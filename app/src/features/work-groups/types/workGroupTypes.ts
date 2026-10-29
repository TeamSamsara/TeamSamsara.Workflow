// File : /TeamSamsara.Workflow/app/src/features/work-groups/types/workGroupTypes.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A work group (workGroups/{id}): a team that tasks can be given to,
// with a name, what it does, its leads (who approve and hand out its tasks)
// and links to the places it works from, like a shared drive. Who is in it is
// kept on each member record (workGroupIds), so a member's page can change
// their groups in one write.

import type { DocumentData } from "firebase/firestore";
import {
  createConverter,
  fromDate,
  readDate,
  readString,
  readStringList,
  type MemberRecord,
} from "@/core/data";

/** A named link, e.g. "Shared drive" → https://drive.google.com/… */
export interface WorkGroupLink {
  label: string;
  url: string;
}

export interface WorkGroupRecord {
  id: string;
  name: string;
  /** What the group does, in a sentence. */
  description: string;
  /** Members responsible for the group; each can approve or reassign tasks. */
  leadIds: string[];
  links: WorkGroupLink[];
  createdAt: Date | null;
}

/** The editable part of a group. */
export interface WorkGroupFields {
  name: string;
  description: string;
  leadIds: string[];
  links: WorkGroupLink[];
}

/** The most leads and links a group can have (firestore.rules checks the same). */
export const WorkGroupLimits = {
  leads: 10,
  links: 10,
} as const;

/** A group in the grid, with the members in it. */
export interface WorkGroupListItem {
  group: WorkGroupRecord;
  /** Null while the member list loads. */
  members: MemberRecord[] | null;
  /** The group's leads who are still in the workspace; null while loading. */
  leads: MemberRecord[] | null;
}

function readLinks(data: DocumentData): WorkGroupLink[] {
  const stored: unknown = data.links;
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((entry: unknown) => {
    if (typeof entry !== "object" || entry === null) return [];
    const link = entry as DocumentData;
    const label = readString(link, "label");
    const url = readString(link, "url");
    return url ? [{ label, url }] : [];
  });
}

function parse(id: string, data: DocumentData): WorkGroupRecord {
  return {
    id,
    name: readString(data, "name"),
    description: readString(data, "description"),
    // Groups made before leads and links existed read as having none.
    leadIds: readStringList(data, "leadIds"),
    links: readLinks(data),
    createdAt: readDate(data, "createdAt"),
  };
}

function serialize(group: WorkGroupRecord): DocumentData {
  return {
    name: group.name,
    description: group.description,
    leadIds: group.leadIds,
    links: group.links,
    createdAt: fromDate(group.createdAt),
  };
}

export const workGroupConverter = createConverter({ parse, serialize });
