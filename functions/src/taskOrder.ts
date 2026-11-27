// File : /TeamSamsara.Workflow/functions/src/taskOrder.ts
// Version : 1.0.0
// Latest commit: feature/1.2-tasks-follow-order
// Author : Gerrah
// Purpose : What a change to a task means for the tasks of its event: what
// each one still waits on (kept on the task, so whoever has it sees why it's
// locked even when they can't open the other task), the ones it unlocks (to
// tell whoever has them), and for a task just done, the due time of each task
// whose due time counts from it (Due from), unless someone set it by hand.

import {
  dueFromDone,
  unlockedBy,
  waitingOnOf,
  type TaskForOrder,
  type WaitingOn,
  type WaitingTask,
} from "../../engine/src/index.js";
import type { TaskRow } from "./engineData.js";

/** A task as the order reads it, from its row. */
export function orderRow(task: TaskRow): TaskForOrder & WaitingTask {
  return {
    id: task.id,
    title: task.title,
    workflowId: task.workflowId,
    stepId: task.stepId,
    doneAt: task.doneAt,
    approvedAt: task.approvedAt,
    sentForReviewAt: task.sentForReviewAt,
    liveLink: task.liveLink,
    waitsOn: task.waitsOn ?? [],
    waitFor: task.waitFor ?? "all",
    whenLate: task.whenLate ?? "wait",
    dueAt: task.dueAt,
    startedAnyway: task.startedAnyway,
  };
}

/** Whether a change could matter to the tasks after it. */
export function couldUnlock(before: TaskRow | null, after: TaskRow): boolean {
  const at = (date: Date | null | undefined) => date?.getTime() ?? null;
  return (
    after.eventId !== null &&
    after.workflowId !== null &&
    (at(before?.doneAt) !== at(after.doneAt) ||
      at(before?.approvedAt) !== at(after.approvedAt) ||
      at(before?.sentForReviewAt) !== at(after.sentForReviewAt) ||
      (before?.liveLink ?? null) !== after.liveLink)
  );
}

export interface OrderEffects {
  /** Tasks that were locked and now aren't. */
  unlocked: TaskRow[];
  /** New due times for Due from tasks. */
  dues: { taskId: string; dueAt: Date }[];
  /** What tasks still wait on, where that changed. */
  waiting: { taskId: string; waitingOn: WaitingOn[] }[];
}

const sameWaiting = (a: readonly WaitingOn[], b: readonly WaitingOn[]) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * What each task should still wait on, for the ones that may have changed:
 * `changed` itself (made, or its order changed) and the tasks after
 * `trigger` (which did something, or was deleted).
 */
export function waitingUpdates(
  siblings: readonly TaskRow[],
  ids: ReadonlySet<string>,
): OrderEffects["waiting"] {
  const rows = siblings.map(orderRow);
  return siblings.flatMap((task, index) => {
    if (!ids.has(task.id) || task.doneAt) return [];
    const waitingOn = waitingOnOf(rows[index], rows);
    return sameWaiting(waitingOn, task.waitingOn ?? [])
      ? []
      : [{ taskId: task.id, waitingOn }];
  });
}

/** The tasks that come after a step. */
const followersOf = (siblings: readonly TaskRow[], stepId: string | null) =>
  siblings.filter((task) =>
    (task.waitsOn ?? []).some((wait) => wait.stepId === stepId),
  );

/** When a task of an event is deleted: what the tasks after it wait on now. */
export function afterDeleted(
  gone: TaskRow,
  siblings: readonly TaskRow[],
): OrderEffects["waiting"] {
  const rest = siblings.filter((task) => task.id !== gone.id);
  return waitingUpdates(
    rest,
    new Set(followersOf(rest, gone.stepId).map((task) => task.id)),
  );
}

export function orderEffects(
  before: TaskRow | null,
  after: TaskRow,
  siblings: readonly TaskRow[],
  now: Date,
  timeZone: string,
): OrderEffects {
  if (!after.eventId || !after.workflowId)
    return { unlocked: [], dues: [], waiting: [] };
  // Made, or its order changed: what it waits on is worked out again.
  const ownChanged =
    !before ||
    JSON.stringify(before.waitsOn ?? []) !==
      JSON.stringify(after.waitsOn ?? []);
  const affects = before !== null && couldUnlock(before, after);
  const ids = new Set<string>(ownChanged ? [after.id] : []);
  if (affects)
    for (const task of followersOf(siblings, after.stepId)) ids.add(task.id);
  const waiting = waitingUpdates(siblings, ids);
  if (!before || !affects) return { unlocked: [], dues: [], waiting };
  const rows = siblings.map(orderRow);
  const unlockedIds = new Set(
    unlockedBy(orderRow(before), orderRow(after), rows, now).map(
      (task) => task.id,
    ),
  );
  const justDone = before.doneAt === null && after.doneAt !== null;
  const dues = justDone
    ? siblings.flatMap((task) => {
        const counts = (task.waitsOn ?? []).some(
          (wait) => wait.dueFrom && wait.stepId === after.stepId,
        );
        if (
          !counts ||
          task.doneAt ||
          !task.dueFromOffset ||
          task.editedParts?.includes("due")
        )
          return [];
        return [
          {
            taskId: task.id,
            dueAt: dueFromDone(
              after.doneAt as Date,
              task.dueFromOffset,
              timeZone,
            ),
          },
        ];
      })
    : [];
  return {
    unlocked: siblings.filter((task) => unlockedIds.has(task.id)),
    dues,
    waiting,
  };
}
