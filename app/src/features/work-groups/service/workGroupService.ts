// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/workGroupService.ts
// Version : 1.0.0
// Latest commit: feature/work-groups
// Author : Gerrah
// Purpose : Creates, edits and deletes work groups. Names and descriptions are
// trimmed on the way in. Deleting a group leaves its id on member records,
// where it no longer means anything (ids are never reused).

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Collections, serverTime } from "@/core/data";
import { db } from "@/lib/firebase";
import type { WorkGroupFields } from "../types/workGroupTypes";

const groupsCollection = () => collection(db, Collections.workGroups);

function tidy(fields: WorkGroupFields): WorkGroupFields {
  return { name: fields.name.trim(), description: fields.description.trim() };
}

/** Adds a group and gives back its id. */
export async function createWorkGroup(
  fields: WorkGroupFields,
): Promise<string> {
  const created = await addDoc(groupsCollection(), {
    ...tidy(fields),
    createdAt: serverTime(),
  });
  return created.id;
}

export function saveWorkGroup(
  id: string,
  fields: WorkGroupFields,
): Promise<void> {
  return updateDoc(doc(groupsCollection(), id), { ...tidy(fields) });
}

export function deleteWorkGroup(id: string): Promise<void> {
  return deleteDoc(doc(groupsCollection(), id));
}
