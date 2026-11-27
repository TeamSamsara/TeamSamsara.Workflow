// File : /TeamSamsara.Workflow/functions/src/workflowReviews.ts
// Version : 1.0.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : After a workflow is saved: saving never moves anyone's tasks, so
// the open tasks whose due time now differs from their step are written down
// for whoever saved it (workflowReviews). In the editor they move them, one
// at a time or all together, or leave them; each one they move is moved here,
// to its step's due time, as long as it's still open and still due when it
// was. A task whose due time someone had changed by hand follows its step
// again once moved.

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";
import type { TaskDiffers } from "./workflowSync.js";

/** At most this many tasks are written down; the rest are counted. */
export const ReviewLimit = 100;

export interface ReviewTask {
  taskId: string;
  title: string;
  eventId: string;
  eventTitle: string;
  from: Date | null;
  to: Date | null;
  edited: boolean;
}

const toTimestamp = (date: Date | null) =>
  date ? Timestamp.fromDate(date) : null;

const toDate = (value: unknown): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;

/** The record a save writes, earliest due first. */
export function reviewDoc(
  workflowId: string,
  workflowName: string,
  byId: string,
  differs: readonly TaskDiffers[],
): DocumentData {
  const sorted = [...differs].sort(
    (a, b) => (a.from?.getTime() ?? Infinity) - (b.from?.getTime() ?? Infinity),
  );
  return {
    workflowId,
    workflowName: workflowName.slice(0, 120),
    byId,
    tasks: sorted.slice(0, ReviewLimit).map((task) => ({
      taskId: task.taskId,
      title: task.title.slice(0, 200),
      eventId: task.eventId,
      eventTitle: task.eventTitle.slice(0, 200),
      from: toTimestamp(task.from),
      to: toTimestamp(task.to),
      edited: task.edited,
    })),
    total: differs.length,
    move: [],
    moved: [],
    skipped: [],
    left: false,
    at: FieldValue.serverTimestamp(),
  };
}

export function readReviewTasks(data: DocumentData | undefined): ReviewTask[] {
  if (!Array.isArray(data?.tasks)) return [];
  return (data.tasks as DocumentData[]).flatMap((entry) =>
    typeof entry?.taskId === "string"
      ? [
          {
            taskId: entry.taskId,
            title: typeof entry.title === "string" ? entry.title : "",
            eventId: typeof entry.eventId === "string" ? entry.eventId : "",
            eventTitle:
              typeof entry.eventTitle === "string" ? entry.eventTitle : "",
            from: toDate(entry.from),
            to: toDate(entry.to),
            edited: entry.edited === true,
          },
        ]
      : [],
  );
}

const ids = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

/** The tasks newly asked to move in this write, from those written down. */
export function newlyAsked(
  before: DocumentData | undefined,
  after: DocumentData | undefined,
): ReviewTask[] {
  const had = new Set([
    ...ids(before?.move),
    ...ids(after?.moved),
    ...ids(after?.skipped),
  ]);
  const asked = new Set(ids(after?.move).filter((id) => !had.has(id)));
  return readReviewTasks(after).filter((task) => asked.has(task.taskId));
}

/**
 * Moves these tasks to their step's due time. Skips a task that's gone,
 * finished, or no longer due when it was (someone moved it since). Returns
 * the ids moved.
 */
export async function moveTasks(
  db: Firestore,
  tasks: readonly ReviewTask[],
): Promise<string[]> {
  const moved: string[] = [];
  for (const task of tasks) {
    const ref = db.doc(`tasks/${task.taskId}`);
    const done = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const data = snapshot.data();
      if (!data || data.doneAt) return false;
      const dueAt = toDate(data.dueAt);
      if ((dueAt?.getTime() ?? null) !== (task.from?.getTime() ?? null))
        return false;
      transaction.update(ref, {
        dueAt: toTimestamp(task.to),
        editedParts: FieldValue.arrayRemove("due"),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    if (done) moved.push(task.taskId);
  }
  return moved;
}
