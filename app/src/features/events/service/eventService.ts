// File : /TeamSamsara.Workflow/app/src/features/events/service/eventService.ts
// Version : 1.7.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Makes an event together with the tasks of its workflows (one batch,
// so it's all or nothing), saves changes (moving its tasks by the same amount
// when the start moves), adds a task to it, brings its tasks in line with its
// workflows, and deletes it with its tasks.

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
import {
  applyWorkflows,
  type Formats,
  type PlannedTask,
} from "../model/applyWorkflows";
import { isLateAtCreation, type LateChoice } from "../model/lateTasks";
import type { TaskRefill } from "../model/refillTasks";
import { refreshWrite, type TaskRefresh } from "../model/workflowRefresh";
import { attendanceData } from "../types/attendance";
import { audienceData } from "../types/audience";
import type { EventFields } from "../types/eventTypes";

/** What every event shares with its repeat: everything but when. */
export type SharedFields = Omit<EventFields, "startsAt" | "endsAt">;

export function sharedData(fields: SharedFields) {
  return {
    title: fields.title.trim(),
    eventTypeId: fields.eventTypeId,
    link: fields.link?.trim() || null,
    details: Object.fromEntries(
      Object.entries(fields.details)
        .map(([gap, value]) => [gap, value.trim()])
        .filter(([, value]) => value !== ""),
    ),
    notes: fields.notes.trim(),
    ...audienceData(fields.audience),
    ...attendanceData(fields.attendance),
  };
}

function tidy(fields: EventFields) {
  return {
    ...sharedData(fields),
    startsAt: fromDate(fields.startsAt),
    endsAt: fromDate(
      fields.endsAt < fields.startsAt ? fields.startsAt : fields.endsAt,
    ),
  };
}

export interface CreateOptions {
  workflows: readonly WorkflowRecord[];
  formats: Formats;
  startingStatusId: string;
  createdBy: string;
  /** Who the event belongs to, when not who makes it (a repeat's maker). */
  eventMaker?: string;
  /** The set it's planned in. */
  setId?: string;
  /**
   * Tasks whose due time has already passed: made and marked "Late from the
   * start" (the default), or left out.
   */
  lateTasks?: LateChoice;
  /** When "already passed" is counted from; now unless given. */
  now?: Date;
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
  {
    workflows,
    formats,
    startingStatusId,
    createdBy,
    eventMaker,
    setId,
    lateTasks = "late",
    now = new Date(),
  }: CreateOptions,
): BatchWrite[] {
  const all = applyWorkflows(
    {
      title: fields.title,
      startsAt: fields.startsAt,
      endsAt: fields.endsAt,
      eventTypeId: fields.eventTypeId,
      link: fields.link,
      details: fields.details,
    },
    workflows,
    formats,
  );
  const planned = all.filter(
    (task) => lateTasks === "late" || !isLateAtCreation(task.dueAt, now),
  );
  return [
    (batch) =>
      batch.set(doc(db, Collections.events, eventId), {
        ...tidy(fields),
        workflowIds: workflows.map((workflow) => workflow.id),
        repeatId,
        setId: setId ?? null,
        createdBy: eventMaker ?? createdBy,
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
            newTaskData(
              task,
              startingStatusId,
              createdBy,
              { eventId, workflowId, stepId },
              isLateAtCreation(task.dueAt, now),
            ),
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
 * so a match moved an hour later keeps every task an hour later too. With
 * refills given, those tasks' text is filled again from the new fields.
 */
export function saveEvent(
  id: string,
  fields: EventFields,
  previousStart: Date,
  tasksToMove: readonly Pick<TaskRecord, "id" | "dueAt">[],
  refills: readonly TaskRefill[] = [],
): Promise<void> {
  const shift = fields.startsAt.getTime() - previousStart.getTime();
  // One update per task, whether it moves, gets new text, or both.
  const changes = new Map<string, Record<string, unknown>>();
  if (shift !== 0) {
    for (const task of tasksToMove) {
      if (!task.dueAt) continue;
      changes.set(task.id, {
        dueAt: fromDate(new Date(task.dueAt.getTime() + shift)),
      });
    }
  }
  for (const refill of refills) {
    changes.set(refill.taskId, {
      ...changes.get(refill.taskId),
      ...refill.changes,
    });
  }
  const writes: BatchWrite[] = [
    (batch) =>
      batch.update(doc(db, Collections.events, id), {
        ...tidy(fields),
        updatedAt: serverTime(),
      }),
    ...[...changes].map(
      ([taskId, change]): BatchWrite =>
        (batch) =>
          batch.update(doc(db, Collections.tasks, taskId), {
            ...change,
            updatedAt: serverTime(),
          }),
    ),
  ];
  return commitWrites(db, writes);
}

/**
 * Brings tasks in line with the event's workflows: the chosen updates (with
 * their due times or not) and new tasks for the chosen steps that had none.
 */
export function refreshEventTasks(
  eventId: string,
  updates: readonly TaskRefresh[],
  withDue: boolean,
  newSteps: readonly PlannedTask[],
  options: { startingStatusId: string; createdBy: string; now?: Date },
): Promise<void> {
  const now = options.now ?? new Date();
  const writes: BatchWrite[] = [
    ...updates.map((refresh): BatchWrite => (batch) => {
      const { dueAt, ...text } = refreshWrite(refresh, withDue);
      batch.update(doc(db, Collections.tasks, refresh.taskId), {
        ...text,
        ...(dueAt !== undefined
          ? { dueAt: dueAt ? fromDate(dueAt) : null }
          : {}),
        updatedAt: serverTime(),
      });
    }),
    ...newSteps.map(
      ({ workflowId, stepId, ...task }): BatchWrite =>
        (batch) =>
          batch.set(
            doc(
              db,
              Collections.tasks,
              eventTaskId(eventId, workflowId, stepId),
            ),
            newTaskData(
              task,
              options.startingStatusId,
              options.createdBy,
              { eventId, workflowId, stepId },
              isLateAtCreation(task.dueAt, now),
            ),
          ),
    ),
  ];
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

/** Changes an event's details and its times without touching its tasks. */
export function eventDetailsWrite(
  id: string,
  fields: SharedFields,
  startsAt: Date,
  endsAt: Date,
): BatchWrite {
  return (batch) =>
    batch.update(doc(db, Collections.events, id), {
      ...sharedData(fields),
      startsAt: fromDate(startsAt),
      endsAt: fromDate(endsAt),
      updatedAt: serverTime(),
    });
}
