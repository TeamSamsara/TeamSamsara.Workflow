// File : /TeamSamsara.Workflow/app/src/features/events/service/eventService.ts
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : Makes an event together with the tasks of its workflows (one batch,
// so it's all or nothing), saves changes (moving its tasks by the same amount
// when the start moves), adds a task to it, and deletes it with its tasks.

import { collection, doc } from "firebase/firestore";
import {
  Collections,
  commitWrites,
  fromDate,
  serverTime,
  type BatchWrite,
} from "@/core/data";
import { newTaskData, type TaskRecord } from "@/features/tasks";
import type { WorkflowRecord } from "@/features/workflows";
import { db } from "@/lib/firebase";
import { applyWorkflows, type Formats } from "../model/applyWorkflows";
import type { EventFields } from "../types/eventTypes";

function tidy(fields: EventFields) {
  return {
    title: fields.title.trim(),
    eventTypeId: fields.eventTypeId,
    startsAt: fromDate(fields.startsAt),
    link: fields.link?.trim() || null,
    details: Object.fromEntries(
      Object.entries(fields.details)
        .map(([gap, value]) => [gap, value.trim()])
        .filter(([, value]) => value !== ""),
    ),
    notes: fields.notes.trim(),
  };
}

interface CreateOptions {
  workflows: readonly WorkflowRecord[];
  formats: Formats;
  startingStatusId: string;
  createdBy: string;
}

/** Makes the event and its workflows' tasks; gives back the event's id. */
export async function createEvent(
  fields: EventFields,
  { workflows, formats, startingStatusId, createdBy }: CreateOptions,
): Promise<string> {
  const eventRef = doc(collection(db, Collections.events));
  const planned = applyWorkflows(
    {
      title: fields.title,
      startsAt: fields.startsAt,
      link: fields.link,
      details: fields.details,
    },
    workflows,
    formats,
  );
  const writes: BatchWrite[] = [
    (batch) =>
      batch.set(eventRef, {
        ...tidy(fields),
        workflowIds: workflows.map((workflow) => workflow.id),
        repeatId: null,
        createdBy,
        createdAt: serverTime(),
        updatedAt: serverTime(),
      }),
    ...planned.map(
      ({ workflowId, stepId, ...task }): BatchWrite =>
        (batch) =>
          batch.set(
            doc(collection(db, Collections.tasks)),
            newTaskData(task, startingStatusId, createdBy, {
              eventId: eventRef.id,
              workflowId,
              stepId,
            }),
          ),
    ),
  ];
  await commitWrites(db, writes);
  return eventRef.id;
}

/**
 * Saves the event. With tasks given, they move by as much as the start did,
 * so a match moved an hour later keeps every task an hour later too.
 */
export function saveEvent(
  id: string,
  fields: EventFields,
  previousStart: Date,
  tasksToMove: readonly Pick<TaskRecord, "id" | "dueAt">[],
): Promise<void> {
  const shift = fields.startsAt.getTime() - previousStart.getTime();
  const writes: BatchWrite[] = [
    (batch) =>
      batch.update(doc(db, Collections.events, id), {
        ...tidy(fields),
        updatedAt: serverTime(),
      }),
  ];
  if (shift !== 0) {
    for (const task of tasksToMove) {
      if (!task.dueAt) continue;
      const dueAt = new Date(task.dueAt.getTime() + shift);
      writes.push((batch) =>
        batch.update(doc(db, Collections.tasks, task.id), {
          dueAt: fromDate(dueAt),
          updatedAt: serverTime(),
        }),
      );
    }
  }
  return commitWrites(db, writes);
}

/** Deletes the event and the tasks it made. */
export function deleteEvent(
  id: string,
  taskIds: readonly string[],
): Promise<void> {
  return commitWrites(db, [
    ...taskIds.map(
      (taskId): BatchWrite =>
        (batch) =>
          batch.delete(doc(db, Collections.tasks, taskId)),
    ),
    (batch) => batch.delete(doc(db, Collections.events, id)),
  ]);
}
