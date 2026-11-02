// File : /TeamSamsara.Workflow/app/src/features/events/service/setService.ts
// Version : 1.0.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : Sets of events: makes a set with its events and their tasks (the
// set first, so each event can point at it), adds more events to one, renames
// it, moves several of its events at once (their tasks move with them), and
// deletes events or the whole set with their tasks.

import { collection, doc, getDocs, query, where } from "firebase/firestore";
import {
  Collections,
  commitWrites,
  fromDate,
  serverTime,
  splitIntoChunks,
  type BatchWrite,
} from "@/core/data";
import { taskConverter, type TaskRecord } from "@/features/tasks";
import type { WorkflowRecord } from "@/features/workflows";
import { db } from "@/lib/firebase";
import { audienceData, type Audience } from "../types/audience";
import type { EventFields, EventRecord } from "../types/eventTypes";
import { EventSetLimits } from "../types/setTypes";
import {
  deleteEventWrites,
  eventWrites,
  type CreateOptions,
} from "./eventService";

export interface SetFields extends Audience {
  name: string;
  eventTypeId: string | null;
  titlePattern: string;
  minutes: number;
}

function setData(fields: SetFields, workflows: readonly WorkflowRecord[]) {
  return {
    name: fields.name.trim().slice(0, EventSetLimits.name),
    eventTypeId: fields.eventTypeId,
    titlePattern: fields.titlePattern.trim(),
    minutes: Math.min(1440, Math.max(5, Math.round(fields.minutes))),
    workflowIds: workflows.map((workflow) => workflow.id),
    ...audienceData(fields),
  };
}

function eventsWrites(
  setId: string,
  events: readonly EventFields[],
  options: CreateOptions,
): BatchWrite[] {
  return events.flatMap((fields) =>
    eventWrites(doc(collection(db, Collections.events)).id, fields, null, {
      ...options,
      setId,
    }),
  );
}

/** Makes the set, its events and their tasks; gives back the set's id. */
export async function createEventSet(
  fields: SetFields,
  events: readonly EventFields[],
  options: CreateOptions,
): Promise<string> {
  const ref = doc(collection(db, Collections.eventSets));
  await commitWrites(db, [
    (batch) =>
      batch.set(ref, {
        ...setData(fields, options.workflows),
        createdBy: options.createdBy,
        createdAt: serverTime(),
        updatedAt: serverTime(),
      }),
    ...eventsWrites(ref.id, events, options),
  ]);
  return ref.id;
}

/** Adds events (and their tasks) to a set that exists. */
export function addToEventSet(
  setId: string,
  events: readonly EventFields[],
  options: CreateOptions,
): Promise<void> {
  return commitWrites(db, eventsWrites(setId, events, options));
}

export function renameEventSet(setId: string, name: string): Promise<void> {
  return commitWrites(db, [
    (batch) =>
      batch.update(doc(db, Collections.eventSets, setId), {
        name: name.trim().slice(0, EventSetLimits.name),
        updatedAt: serverTime(),
      }),
  ]);
}

/** The tasks of these events, read once. */
export async function tasksOfEvents(
  eventIds: readonly string[],
): Promise<TaskRecord[]> {
  const chunks = await Promise.all(
    splitIntoChunks(eventIds, 30).map((chunk) =>
      getDocs(
        query(
          collection(db, Collections.tasks),
          where("eventId", "in", chunk),
        ).withConverter(taskConverter),
      ),
    ),
  );
  return chunks.flatMap((snapshot) =>
    snapshot.docs.map((entry) => entry.data()),
  );
}

export interface EventMove {
  event: Pick<EventRecord, "id" | "startsAt" | "endsAt">;
  /** Where it starts now; its end and its tasks move by as much. */
  startsAt: Date;
}

/** Moves each event to its new start; its end and its tasks' due times follow. */
export async function moveEvents(moves: readonly EventMove[]): Promise<void> {
  const shifts = new Map(
    moves.map(({ event, startsAt }) => [
      event.id,
      startsAt.getTime() - event.startsAt.getTime(),
    ]),
  );
  const moving = moves.filter(({ event }) => shifts.get(event.id) !== 0);
  if (moving.length === 0) return;
  const tasks = await tasksOfEvents(moving.map(({ event }) => event.id));
  const later = (date: Date, shift: number) =>
    fromDate(new Date(date.getTime() + shift));
  await commitWrites(db, [
    ...moving.map(
      ({ event, startsAt }): BatchWrite =>
        (batch) =>
          batch.update(doc(db, Collections.events, event.id), {
            startsAt: fromDate(startsAt),
            endsAt: later(event.endsAt, shifts.get(event.id) ?? 0),
            updatedAt: serverTime(),
          }),
    ),
    ...tasks.flatMap((task): BatchWrite[] =>
      task.dueAt && task.eventId
        ? [
            (batch) =>
              batch.update(doc(db, Collections.tasks, task.id), {
                dueAt: later(
                  task.dueAt ?? new Date(),
                  shifts.get(task.eventId ?? "") ?? 0,
                ),
                updatedAt: serverTime(),
              }),
          ]
        : [],
    ),
  ]);
}

/** Deletes these events with their tasks. */
export async function deleteEvents(eventIds: readonly string[]): Promise<void> {
  const tasks = await tasksOfEvents(eventIds);
  await commitWrites(
    db,
    eventIds.flatMap((eventId) =>
      deleteEventWrites(
        eventId,
        tasks.filter((task) => task.eventId === eventId).map((task) => task.id),
      ),
    ),
  );
}

/** Deletes the set, its events and their tasks; the set goes last. */
export async function deleteEventSet(
  setId: string,
  eventIds: readonly string[],
): Promise<void> {
  await deleteEvents(eventIds);
  await commitWrites(db, [
    (batch) => batch.delete(doc(db, Collections.eventSets, setId)),
  ]);
}
