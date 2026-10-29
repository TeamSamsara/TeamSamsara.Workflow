// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/workGroupService.ts
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Creates, edits and deletes work groups. Names and descriptions are
// trimmed on the way in. Who is in a group is kept on member records, so adding
// and removing people writes there; deleting a group takes it off them too.

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
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

/** Deletes the group, then takes it off its members (tidying: a dead id means nothing). */
export async function deleteWorkGroup(id: string): Promise<void> {
  await deleteDoc(doc(groupsCollection(), id));
  const inGroup = await getDocs(
    query(
      collection(db, Collections.members),
      where("workGroupIds", "array-contains", id),
    ),
  );
  await Promise.allSettled(
    inGroup.docs.map((member) =>
      updateDoc(member.ref, { workGroupIds: arrayRemove(id) }),
    ),
  );
}

/** Puts these members in the group. */
export function addToWorkGroup(
  groupId: string,
  memberIds: readonly string[],
): Promise<void[]> {
  return Promise.all(
    memberIds.map((memberId) =>
      updateDoc(doc(db, Collections.members, memberId), {
        workGroupIds: arrayUnion(groupId),
      }),
    ),
  );
}

/** Takes one member out of the group. */
export function removeFromWorkGroup(
  groupId: string,
  memberId: string,
): Promise<void> {
  return updateDoc(doc(db, Collections.members, memberId), {
    workGroupIds: arrayRemove(groupId),
  });
}
