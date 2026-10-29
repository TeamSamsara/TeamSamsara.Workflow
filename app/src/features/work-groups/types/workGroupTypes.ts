// File : /TeamSamsara.Workflow/app/src/features/work-groups/types/workGroupTypes.ts
// Version : 1.1.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A work group (workGroups/{id}): a team that tasks can be given to,
// with a name, what it does, the leads responsible for it, and its links
// (a shared drive, brand assets…). Who is in it is kept on each member record
// (workGroupIds), so a member's page can change their groups in one write.

import type { DocumentData } from "firebase/firestore";
import {
  createConverter,
  fromDate,
  readDate,
  readMap,
  readString,
  readStringList,
  type MemberRecord,
} from "@/core/data";

/** At most this many leads; firestore.rules checks each one, so keep them in step. */
export const maxGroupLeads = 5;
/** At most this many links; firestore.rules checks the same. */
export const maxGroupLinks = 10;

/** A named link, like "Shared drive" → https://drive.google.com/… */
export interface WorkGroupLink {
  label: string;
  url: string;
}

export interface WorkGroupRecord {
  id: string;
  name: string;
  /** What the group does, in a sentence. */
  description: string;
  /**
   * Members responsible for the group, who approve and hand out its tasks.
   * Each must hold Approve tasks or Reassign tasks.
   */
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

/** A group in the grid, with the members in it. */
export interface WorkGroupListItem {
  group: WorkGroupRecord;
  /** Null while the member list loads. */
  members: MemberRecord[] | null;
}

function readLinks(data: DocumentData): WorkGroupLink[] {
  const stored: unknown = data.links;
  if (!Array.isArray(stored)) return [];
  return stored
    .map((entry: unknown) => readMap({ entry }, "entry"))
    .map((entry) => ({
      label: readString(entry, "label"),
      url: readString(entry, "url"),
    }))
    .filter((link) => link.url);
}

function parse(id: string, data: DocumentData): WorkGroupRecord {
  return {
    id,
    name: readString(data, "name"),
    description: readString(data, "description"),
    // Groups made before leads and links existed have neither.
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
    links: group.links.map(({ label, url }) => ({ label, url })),
    createdAt: fromDate(group.createdAt),
  };
}

export const workGroupConverter = createConverter({ parse, serialize });
