// File : /TeamSamsara.Workflow/app/src/features/workflows/service/workflowService.ts
// Version : 1.1.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : Creates, saves, archives, restores and deletes workflows. Only
// archived workflows can be deleted; tasks already made from one keep their own
// copy of its steps. After a save, moves the tasks that differ from their
// step, or leaves them, as whoever saved it chooses.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Collections, serverTime } from "@/core/data";
import { db } from "@/lib/firebase";
import { tidyWorkflow } from "../model/workflowDraft";
import type { WorkflowFields } from "../types/workflowTypes";

const workflowsCollection = () => collection(db, Collections.workflows);

/** Adds a workflow and gives back its id. */
export async function createWorkflow(fields: WorkflowFields): Promise<string> {
  const created = await addDoc(workflowsCollection(), {
    ...tidyWorkflow(fields),
    archived: false,
    createdAt: serverTime(),
    updatedAt: serverTime(),
  });
  return created.id;
}

export function saveWorkflow(
  id: string,
  fields: WorkflowFields,
): Promise<void> {
  return updateDoc(doc(workflowsCollection(), id), {
    ...tidyWorkflow(fields),
    updatedAt: serverTime(),
  });
}

export function setWorkflowArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  return updateDoc(doc(workflowsCollection(), id), {
    archived,
    updatedAt: serverTime(),
  });
}

export function deleteWorkflow(id: string): Promise<void> {
  return deleteDoc(doc(workflowsCollection(), id));
}

/** After a save: asks the server to move these tasks to their step's due time. */
export function moveDifferingTasks(
  reviewId: string,
  alreadyAsked: readonly string[],
  taskIds: readonly string[],
): Promise<void> {
  return updateDoc(doc(db, Collections.workflowReviews, reviewId), {
    move: [...new Set([...alreadyAsked, ...taskIds])],
  });
}

/** After a save: leaves the rest of the differing tasks as they are. */
export function leaveDifferingTasks(reviewId: string): Promise<void> {
  return updateDoc(doc(db, Collections.workflowReviews, reviewId), {
    left: true,
  });
}
