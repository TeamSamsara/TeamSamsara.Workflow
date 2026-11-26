// File : /TeamSamsara.Workflow/app/src/features/work-groups/service/workGroupService.ts
// Version : 2.1.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Creates, edits and deletes work groups. Names and descriptions are
// trimmed on the way in. Who is in a group is kept on member records, and who
// leads it on the group, but both are protected changes the server makes
// (a lead is always a member; taking someone out needs them strictly below
// you). Deleting a group takes it off its members on the server too.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { manage } from "@/core/access";
import { Collections, serverTime } from "@/core/data";
import { db } from "@/lib/firebase";
import type { WorkGroupFields } from "../types/workGroupTypes";

const groupsCollection = () => collection(db, Collections.workGroups);

function tidy(fields: WorkGroupFields) {
  return {
    // Left out until one is picked, so groups stay as they were.
    ...(fields.color ? { color: fields.color } : {}),
    name: fields.name.trim(),
    description: fields.description.trim(),
    links: fields.links
      .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
      .filter((link) => link.url),
  } as Omit<WorkGroupFields, "color" | "leadIds"> & { color?: string };
}

/** Adds a group and gives back its id. */
export async function createWorkGroup(
  fields: WorkGroupFields,
): Promise<string> {
  const created = await addDoc(groupsCollection(), {
    ...tidy(fields),
    leadIds: [],
    createdAt: serverTime(),
  });
  if (fields.leadIds.length)
    await manage({
      op: "group.leads",
      groupId: created.id,
      leadIds: fields.leadIds,
    });
  return created.id;
}

export async function saveWorkGroup(
  id: string,
  fields: WorkGroupFields,
): Promise<void> {
  await updateDoc(doc(groupsCollection(), id), { ...tidy(fields) });
  await manage({
    op: "group.leads",
    groupId: id,
    leadIds: [...new Set(fields.leadIds)],
  });
}

/** A change to how a group hands out its tasks; only what's given changes. */
export interface HandOutChange {
  on?: boolean;
  dailyLimit?: number;
  headsUpHours?: number;
  /** Who doesn't take its tasks. */
  skip?: string[];
}

/**
 * Changes how a group hands out its tasks. The switch, limit and heads-up
 * need Manage work groups; who takes tasks is also the leads' to choose.
 */
export async function changeHandOut(
  groupId: string,
  change: HandOutChange,
): Promise<void> {
  await manage({ op: "group.assign", groupId, ...change });
}

/** Deletes the group; the server takes it off its members. */
export async function deleteWorkGroup(id: string): Promise<void> {
  await deleteDoc(doc(groupsCollection(), id));
}

/** A member's groups as they are now, to change one. */
async function groupsOf(memberId: string): Promise<string[]> {
  const snapshot = await getDoc(doc(db, Collections.members, memberId));
  const stored: unknown = snapshot.data()?.workGroupIds;
  return Array.isArray(stored)
    ? stored.filter((id): id is string => typeof id === "string")
    : [];
}

/** Puts these members in the group. */
export function addToWorkGroup(
  groupId: string,
  memberIds: readonly string[],
): Promise<void[]> {
  return Promise.all(
    memberIds.map(async (memberId) => {
      const groups = await groupsOf(memberId);
      if (groups.includes(groupId)) return;
      await manage({
        op: "member.update",
        memberId,
        workGroupIds: [...groups, groupId],
      });
    }),
  );
}

/** Takes one member out of the group (and ends their lead there). */
export async function removeFromWorkGroup(
  groupId: string,
  memberId: string,
): Promise<void> {
  const groups = await groupsOf(memberId);
  await manage({
    op: "member.update",
    memberId,
    workGroupIds: groups.filter((id) => id !== groupId),
  });
}
