// File : /TeamSamsara.Workflow/functions/src/workflowSync.ts
// Version : 1.3.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : Keeps upcoming events' tasks in line with their workflows, in the
// background. When a workflow is saved, every event that uses it and may
// still have open tasks (still to come, or started in the last
// RecentEventDays days, such as a recap due the day after) gets its open
// tasks updated, part by part, by the engine's rules (parts
// changed by hand stay), and a task for each step added in this save. A
// save never moves a due time: tasks whose due time differs from their step
// are reported (differs), for whoever saved it to move or leave. The
// same pass, without a previous version to compare with, is what the first
// platform update runs on tasks planned before this existed.

import type { Firestore } from "firebase-admin/firestore";
import {
  freshTask,
  gapValues,
  planTaskSync,
  taskFromStep,
  waitingOnAtCreation,
  type Formats,
  type PlannedTask,
  type TaskSync,
} from "../../engine/src/index.js";
import { orderRow } from "./taskOrder.js";
import {
  commitInBatches,
  engineFormats,
  eventTaskId,
  newTaskDoc,
  readEvent,
  readTask,
  startingStatusId,
  syncUpdate,
  type EventRow,
  type TaskRow,
  type WorkflowData,
} from "./engineData.js";

export interface SyncResult {
  /** Tasks that changed. */
  updated: TaskSync[];
  /** Tasks made for steps added in this save. */
  createdIds: string[];
  /** Tasks with parts kept (changed by hand, or a due time already passed). */
  held: (TaskSync & { eventTitle: string })[];
  /** Open tasks whose due time differs from their step's (saves only). */
  differs: TaskDiffers[];
  events: number;
}

export interface TaskDiffers {
  taskId: string;
  title: string;
  eventId: string;
  eventTitle: string;
  from: Date | null;
  to: Date | null;
  /** Its due time was changed by hand. */
  edited: boolean;
}

const emptyResult = (): SyncResult => ({
  updated: [],
  createdIds: [],
  held: [],
  differs: [],
  events: 0,
});

/** How far back an event's open tasks still follow its workflow. */
export const RecentEventDays = 30;

/** The events that use a workflow and may still have open tasks. */
async function upcomingEvents(
  db: Firestore,
  workflowId: string,
  now: Date,
): Promise<EventRow[]> {
  const since = new Date(now.getTime() - RecentEventDays * 24 * 3600 * 1000);
  const snapshot = await db
    .collection("events")
    .where("workflowIds", "array-contains", workflowId)
    .where("startsAt", ">=", since)
    .get();
  return snapshot.docs.map((doc) => readEvent(doc.id, doc.data()));
}

async function tasksOf(
  db: Firestore,
  eventId: string,
  workflowId: string,
): Promise<TaskRow[]> {
  const snapshot = await db
    .collection("tasks")
    .where("eventId", "==", eventId)
    .where("workflowId", "==", workflowId)
    .get();
  return snapshot.docs.map((doc) => readTask(doc.id, doc.data()));
}

export interface SyncOptions {
  /** The workflow before this save; null when unknown (the platform update). */
  before: WorkflowData | null;
  after: WorkflowData;
  /** Only report what would change. */
  dryRun?: boolean;
  /** Who saved it, as the maker of any new tasks. */
  byId?: string | null;
  now?: Date;
  formats?: Formats;
}

/** Brings the upcoming events of one workflow in line with it. */
export async function syncWorkflow(
  db: Firestore,
  {
    before,
    after,
    dryRun = false,
    byId = null,
    now = new Date(),
    formats,
  }: SyncOptions,
): Promise<SyncResult> {
  const result = emptyResult();
  const events = await upcomingEvents(db, after.id, now);
  if (events.length === 0) return result;
  const shown = formats ?? (await engineFormats(db));
  const statusId = await startingStatusId(db);
  const writes: ((batch: FirebaseFirestore.WriteBatch) => void)[] = [];

  for (const event of events) {
    const tasks = await tasksOf(db, event.id, after.id);
    const values = gapValues(event, shown);
    // Tasks for steps new in this save, made once the event's are all known.
    const made: { id: string; planned: PlannedTask }[] = [];
    for (const step of after.steps) {
      const next = taskFromStep(
        step,
        after.id,
        event,
        values,
        shown,
        after.steps,
      );
      const oldStep = before?.steps.find((entry) => entry.id === step.id);
      const previous =
        oldStep && before
          ? taskFromStep(oldStep, after.id, event, values, shown, before.steps)
          : null;
      const task = tasks.find((entry) => entry.stepId === step.id);
      if (!task) {
        // Only a step new in this save gets a task: one that existed before
        // and has none on this event was deleted from it on purpose.
        if (before && !oldStep && statusId && event.startsAt >= now) {
          const id = eventTaskId(event.id, after.id, step.id);
          result.createdIds.push(id);
          made.push({ id, planned: next });
        }
        continue;
      }
      // A save (with a previous version) never moves due times.
      const sync = planTaskSync(task, next, previous, {
        now,
        keepDue: before !== null,
      });
      if (!sync) continue;
      if (sync.dueDiffers)
        result.differs.push({
          taskId: sync.taskId,
          title: sync.title,
          eventId: event.id,
          eventTitle: event.title,
          ...sync.dueDiffers,
        });
      if (sync.held.length > 0)
        result.held.push({ ...sync, eventTitle: event.title });
      if (sync.parts.length === 0) continue;
      result.updated.push(sync);
      if (!dryRun)
        writes.push((batch) =>
          batch.update(
            db.doc(`tasks/${sync.taskId}`),
            syncUpdate(sync.changes as Record<string, unknown>),
          ),
        );
    }
    // Each new task is made knowing what it waits on: the event's tasks
    // already there and the others made with it.
    const others = [
      ...tasks.map(orderRow),
      ...made.map(({ id, planned }) => freshTask(id, planned)),
    ];
    for (const { id, planned } of made) {
      if (dryRun || !statusId) continue;
      const waitingOn = waitingOnAtCreation(
        {
          id,
          workflowId: after.id,
          waitsOn: planned.waitsOn,
          waitFor: planned.waitFor,
        },
        others,
      );
      writes.push((batch) =>
        batch.create(
          db.doc(`tasks/${id}`),
          newTaskDoc(
            planned,
            event,
            statusId,
            byId ?? event.createdBy,
            now,
            waitingOn,
          ),
        ),
      );
    }
  }
  result.events = events.length;
  if (!dryRun) await commitInBatches(db, writes);
  return result;
}

/** Whether a save changed anything a task is made from. */
export function stepsChanged(
  before: WorkflowData,
  after: WorkflowData,
): boolean {
  return JSON.stringify(before.steps) !== JSON.stringify(after.steps);
}

/** "Prep caption, Record voice coms" — the steps a save changed, for the notification. */
export function changedStepTitles(
  before: WorkflowData,
  after: WorkflowData,
): string[] {
  return after.steps
    .filter((step) => {
      const old = before.steps.find((entry) => entry.id === step.id);
      return !old || JSON.stringify(old) !== JSON.stringify(step);
    })
    .map((step) => step.title.trim())
    .filter(Boolean);
}
