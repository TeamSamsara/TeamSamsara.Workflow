// File : /TeamSamsara.Workflow/functions/src/workflowSync.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Keeps upcoming events' tasks in line with their workflows, in the
// background. When a workflow is saved, every event still to come that uses
// it gets its open tasks updated, part by part, by the engine's rules (parts
// changed by hand stay), and a task for each step added in this save. The
// same pass, without a previous version to compare with, is what the first
// platform update runs on tasks planned before this existed.

import type { Firestore } from "firebase-admin/firestore";
import {
  gapValues,
  planTaskSync,
  taskFromStep,
  type Formats,
  type TaskSync,
} from "../../engine/src/index.js";
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
  events: number;
}

const emptyResult = (): SyncResult => ({
  updated: [],
  createdIds: [],
  held: [],
  events: 0,
});

/** The events still to come that use a workflow. */
async function upcomingEvents(
  db: Firestore,
  workflowId: string,
  now: Date,
): Promise<EventRow[]> {
  const snapshot = await db
    .collection("events")
    .where("workflowIds", "array-contains", workflowId)
    .where("startsAt", ">=", now)
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
  { before, after, dryRun = false, byId = null, now = new Date(), formats }: SyncOptions,
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
    for (const step of after.steps) {
      const next = taskFromStep(step, after.id, event, values, shown);
      const oldStep = before?.steps.find((entry) => entry.id === step.id);
      const previous = oldStep
        ? taskFromStep(oldStep, after.id, event, values, shown)
        : null;
      const task = tasks.find((entry) => entry.stepId === step.id);
      if (!task) {
        // Only a step new in this save gets a task: one that existed before
        // and has none on this event was deleted from it on purpose.
        if (before && !oldStep && statusId) {
          const id = eventTaskId(event.id, after.id, step.id);
          result.createdIds.push(id);
          if (!dryRun)
            writes.push((batch) =>
              batch.create(
                db.doc(`tasks/${id}`),
                newTaskDoc(next, event, statusId, byId ?? event.createdBy, now),
              ),
            );
        }
        continue;
      }
      const sync = planTaskSync(task, next, previous, { now });
      if (!sync) continue;
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
