// File : /TeamSamsara.Workflow/app/src/features/work-groups/types/workGroupTypes.ts
// Version : 1.0.0
// Latest commit: feature/work-groups
// Author : Gerrah
// Purpose : A work group (workGroups/{id}): a team that tasks can be given to,
// with a name and what it does. Who is in it is kept on each member record
// (workGroupIds), so a member's page can change their groups in one write.

import type { DocumentData } from "firebase/firestore";
import {
  createConverter,
  fromDate,
  readDate,
  readString,
  type MemberRecord,
} from "@/core/data";

export interface WorkGroupRecord {
  id: string;
  name: string;
  /** What the group does, in a sentence. */
  description: string;
  createdAt: Date | null;
}

/** The editable part of a group. */
export interface WorkGroupFields {
  name: string;
  description: string;
}

/** A group in the grid, with the members in it. */
export interface WorkGroupListItem {
  group: WorkGroupRecord;
  /** Null while the member list loads. */
  members: MemberRecord[] | null;
}

function parse(id: string, data: DocumentData): WorkGroupRecord {
  return {
    id,
    name: readString(data, "name"),
    description: readString(data, "description"),
    createdAt: readDate(data, "createdAt"),
  };
}

function serialize(group: WorkGroupRecord): DocumentData {
  return {
    name: group.name,
    description: group.description,
    createdAt: fromDate(group.createdAt),
  };
}

export const workGroupConverter = createConverter({ parse, serialize });
