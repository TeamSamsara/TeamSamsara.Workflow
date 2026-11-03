// File : /TeamSamsara.Workflow/app/src/features/task-setup/service/setupListService.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Saves the workspace's lists (statuses, event types, tags): add an
// item at the end, edit it, delete it, and save a new order in one batch.
// Names are trimmed on the way in. Needs Manage settings.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Collections, commitWrites, type BatchWrite } from "@/core/data";
import { db } from "@/lib/firebase";

/** The lists this page edits. */
export type SetupListName =
  | typeof Collections.statuses
  | typeof Collections.eventTypes
  | typeof Collections.tags;

function tidy<TData extends { name?: string }>(data: TData): TData {
  return data.name === undefined ? data : { ...data, name: data.name.trim() };
}

/** Adds an item after the last one and gives back its id. */
export async function addSetupItem<TData extends { name: string }>(
  list: SetupListName,
  data: TData,
  lastPosition: number,
): Promise<string> {
  const created = await addDoc(collection(db, list), {
    ...tidy(data),
    position: lastPosition + 1,
  });
  return created.id;
}

export function saveSetupItem<TData extends { name?: string }>(
  list: SetupListName,
  id: string,
  data: TData,
): Promise<void> {
  return updateDoc(doc(db, list, id), tidy(data));
}

export function deleteSetupItem(
  list: SetupListName,
  id: string,
): Promise<void> {
  return deleteDoc(doc(db, list, id));
}

/** Saves the list's order: each id gets its index as its position. */
export function saveSetupOrder(
  list: SetupListName,
  orderedIds: readonly string[],
): Promise<void> {
  const writes: BatchWrite[] = orderedIds.map(
    (id, position) => (batch) => batch.update(doc(db, list, id), { position }),
  );
  return commitWrites(db, writes);
}
