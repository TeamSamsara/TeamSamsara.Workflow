// File : /TeamSamsara.Workflow/app/src/features/events/service/eventService.ts
// Version : 1.1.0
// Latest commit: feature/repeats
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

export interface CreateOptions {
  workflows: readonly WorkflowRecord[];
  formats: Formats;
  startingStatusId: string;
  createdBy: string;
}

/** A task's id for an event: the same whoever makes it, so it's never made twice. */
export function eventTaskId(
  eventId: string,
  workflowId: string,
  stepId: string,
): string {
  return `${eventId}_${workflowId}_${stepId}`;
}

/** The writes that make an event and its workflows' tasks. */
export function eventWrites(
  eventId: string,
  fields: EventFields,
  repeatId: string | null,
  { workflows, formats, startingStatusId, createdBy }: CreateOptions,
): BatchWrite[] {
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
  return [
    (batch) =>
      batch.set(doc(db, Collections.events, eventId), {
        ...tidy(fields),
        workflowIds: workflows.map((workflow) => workflow.id),
        repeatId,
        createdBy,
        createdAt: serverTime(),
        updatedAt: serverTime(),
      }),
    ...planned.map(
      ({ workflowId, stepId, ...task }): BatchWrite =>
        (batch) =>
          batch.set(
            doc(
              db,
              Collections.tasks,
              eventTaskId(eventId, workflowId, stepId),
            ),
            newTaskData(task, startingStatusId, createdBy, {
              eventId,
              workflowId,
              stepId,
            }),
          ),
    ),
  ];
}

/** Makes the event and its workflows' tasks; gives back the event's id. */
export async function createEvent(
  fields: EventFields,
  options: CreateOptions,
): Promise<string> {
  const eventId = doc(collection(db, Collections.events)).id;
  await commitWrites(db, eventWrites(eventId, fields, null, options));
  return eventId;
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

/** The writes that delete an event and the tasks it made. */
export function deleteEventWrites(
  id: string,
  taskIds: readonly string[],
): BatchWrite[] {
  return [
    ...taskIds.map(
      (taskId): BatchWrite =>
        (batch) =>
          batch.delete(doc(db, Collections.tasks, taskId)),
    ),
    (batch) => batch.delete(doc(db, Collections.events, id)),
  ];
}

/** Deletes the event and the tasks it made. */
export function deleteEvent(
  id: string,
  taskIds: readonly string[],
): Promise<void> {
  return commitWrites(db, deleteEventWrites(id, taskIds));
}

/** Changes an event's details (and its start, when given) without touching its tasks. */
export function eventDetailsWrite(
  id: string,
  fields: Omit<EventFields, "startsAt">,
  startsAt?: Date,
): BatchWrite {
  const { title, eventTypeId, link, details, notes } = tidy({
    ...fields,
    startsAt: new Date(),
  });
  return (batch) =>
    batch.update(doc(db, Collections.events, id), {
      title,
      eventTypeId,
      link,
      details,
      notes,
      ...(startsAt ? { startsAt: fromDate(startsAt) } : {}),
      updatedAt: serverTime(),
    });
}
