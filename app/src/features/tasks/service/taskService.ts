// File : /TeamSamsara.Workflow/app/src/features/tasks/service/taskService.ts
// Version : 1.1.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : Every change to a task: make one, edit it, move it on (send for
// review, approve, ask for changes, mark done, reopen, set a status), tick its
// checklist, add the published link, give it to someone else, delete it. Each
// write says who and when, and firestore.rules checks it was theirs to make.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  type UpdateData,
  type DocumentData,
} from "firebase/firestore";
import { Collections, fromDate, serverTime } from "@/core/data";
import { db } from "@/lib/firebase";
import type { TaskAction } from "../model/taskStatusFlow";
import type { TaskChecklistItem, TaskFields } from "../types/taskTypes";

const tasks = () => collection(db, Collections.tasks);

function tidy(fields: TaskFields) {
  return {
    title: fields.title.trim(),
    notes: fields.notes.trim(),
    workGroupId: fields.workGroupId,
    memberId: fields.memberId,
    dueAt: fromDate(fields.dueAt),
    needsApproval: fields.needsApproval,
    tagIds: fields.tagIds,
    posts: fields.posts,
    checklist:
      fields.checklist
        ?.map((item) => ({ ...item, text: item.text.trim() }))
        .filter((item) => item.text.length > 0) ?? null,
    links:
      fields.links?.map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
      })) ?? null,
    asksForLiveLink: fields.asksForLiveLink,
  };
}

/** Where a task came from; all null for a task made on its own. */
export interface TaskOrigin {
  eventId: string | null;
  workflowId: string | null;
  stepId: string | null;
}

const standalone: TaskOrigin = {
  eventId: null,
  workflowId: null,
  stepId: null,
};

/** Everything a new task's document holds, for a write or a batch. */
export function newTaskData(
  fields: TaskFields,
  startingStatusId: string,
  createdBy: string,
  origin: TaskOrigin = standalone,
) {
  return {
    ...tidy(fields),
    statusId: startingStatusId,
    liveLink: null,
    ...origin,
    sentForReviewBy: null,
    sentForReviewAt: null,
    approvedBy: null,
    approvedAt: null,
    changesRequested: null,
    createdBy,
    createdAt: serverTime(),
    updatedAt: serverTime(),
    doneAt: null,
  };
}

/** Makes a task and gives back its id; on its own unless an origin is given. */
export async function createTask(
  fields: TaskFields,
  startingStatusId: string,
  createdBy: string,
  origin: TaskOrigin = standalone,
): Promise<string> {
  const created = await addDoc(
    tasks(),
    newTaskData(fields, startingStatusId, createdBy, origin),
  );
  return created.id;
}

function update(id: string, changes: UpdateData<DocumentData>) {
  return updateDoc(doc(tasks(), id), { ...changes, updatedAt: serverTime() });
}

export function saveTaskFields(id: string, fields: TaskFields): Promise<void> {
  return update(id, tidy(fields));
}

interface MoveOptions {
  /** Who is doing it. */
  by: string;
  /** Whether the new status counts as finished or closed. */
  finishes: boolean;
  /** For Ask for changes: what to change. */
  note?: string;
}

/** Moves a task on, with what each move records. */
export function moveTask(
  id: string,
  action: TaskAction,
  { by, finishes, note }: MoveOptions,
): Promise<void> {
  const doneAt = finishes ? serverTime() : null;
  switch (action.kind) {
    case "sendForReview":
      return update(id, {
        statusId: action.statusId,
        sentForReviewBy: by,
        sentForReviewAt: serverTime(),
        changesRequested: null,
        doneAt: null,
      });
    case "approve":
      return update(id, {
        statusId: action.statusId,
        approvedBy: by,
        approvedAt: serverTime(),
        changesRequested: null,
        doneAt,
      });
    case "askForChanges":
      return update(id, {
        statusId: action.statusId,
        approvedBy: null,
        approvedAt: null,
        changesRequested: note?.trim() || null,
        doneAt: null,
      });
    case "markDone":
      return update(id, { statusId: action.statusId, doneAt });
    case "reopen":
      return update(id, {
        statusId: action.statusId,
        approvedBy: null,
        approvedAt: null,
        doneAt: null,
      });
  }
}

/** Sets any status (for people who may edit any task). */
export function setTaskStatus(
  id: string,
  statusId: string,
  finishes: boolean,
): Promise<void> {
  return update(id, { statusId, doneAt: finishes ? serverTime() : null });
}

export function setChecklist(
  id: string,
  checklist: TaskChecklistItem[],
): Promise<void> {
  return update(id, { checklist });
}

export function setLiveLink(
  id: string,
  liveLink: string | null,
): Promise<void> {
  return update(id, { liveLink: liveLink?.trim() || null });
}

export function reassignTask(
  id: string,
  workGroupId: string | null,
  memberId: string | null,
): Promise<void> {
  return update(id, { workGroupId, memberId });
}

export function deleteTask(id: string): Promise<void> {
  return deleteDoc(doc(tasks(), id));
}
