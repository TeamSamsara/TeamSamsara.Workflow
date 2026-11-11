// File : /TeamSamsara.Workflow/app/src/features/events/service/workflowSyncService.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Passing a saved workflow on to the tasks it made for upcoming
// events. Reads those tasks and their events once, then writes the updates in
// batches with a record of the sync, which the server turns into one
// notification per person whose tasks moved.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Collections,
  commitWrites,
  dataErrorKind,
  fromDate,
  serverTime,
  type BatchWrite,
} from "@/core/data";
import { taskConverter, type TaskRecord } from "@/features/tasks";
import { db } from "@/lib/firebase";
import { eventConverter } from "../types/eventTypes";
import {
  changesToWrite,
  type SyncEvent,
  type SyncPlan,
} from "../model/workflowSync";

/** The furthest a task can be due before its event (WorkflowLimits.dueDays), and a day more. */
const lookBackMs = 61 * 24 * 60 * 60 * 1000;

export interface SyncSource {
  tasks: TaskRecord[];
  events: SyncEvent[];
}

/** The workflow's tasks that could belong to upcoming events, and those events. */
export async function readSyncSource(
  workflowId: string,
  now: Date,
): Promise<SyncSource> {
  const snapshot = await getDocs(
    query(
      collection(db, Collections.tasks),
      where("workflowId", "==", workflowId),
      where("dueAt", ">=", fromDate(new Date(now.getTime() - lookBackMs))),
    ).withConverter(taskConverter),
  );
  const tasks = snapshot.docs.map((entry) => entry.data());
  const eventIds = [
    ...new Set(tasks.flatMap((task) => (task.eventId ? [task.eventId] : []))),
  ];
  const events = await Promise.all(
    eventIds.map(async (id) => {
      try {
        const found = await getDoc(
          doc(db, Collections.events, id).withConverter(eventConverter),
        );
        return found.exists() ? [found.data()] : [];
      } catch (error) {
        if (dataErrorKind(error) === "notAllowed") return [];
        throw error;
      }
    }),
  );
  return {
    tasks,
    events: events
      .flat()
      .filter((event) => event.startsAt.getTime() >= now.getTime()),
  };
}

export interface SyncRecord {
  workflowId: string;
  workflowName: string;
  byId: string;
  /** What changed, a line per task, e.g. "Prep caption is now due 2 days before at 11:30 PM". */
  changes: string[];
}

/** Writes the updates (late ones move only if picked) and records the sync. */
export async function applyWorkflowSync(
  plan: SyncPlan,
  moveAnyway: ReadonlySet<string>,
  record: SyncRecord,
): Promise<number> {
  const updates = [
    ...plan.update.map((update) => ({ update, move: true })),
    ...plan.alreadyLate.map((update) => ({
      update,
      move: moveAnyway.has(update.taskId),
    })),
  ].flatMap(({ update, move }) => {
    const changes = changesToWrite(update, move);
    return Object.keys(changes).length > 0
      ? [{ taskId: update.taskId, changes }]
      : [];
  });
  if (updates.length === 0) return 0;

  const writes: BatchWrite[] = updates.map(
    ({ taskId, changes }): BatchWrite =>
      (batch) =>
        batch.update(doc(db, Collections.tasks, taskId), {
          ...changes,
          ...(changes.dueAt !== undefined
            ? { dueAt: fromDate(changes.dueAt) }
            : {}),
          updatedAt: serverTime(),
        }),
  );
  await commitWrites(db, writes);
  // Recorded once the tasks are saved, so the notification never runs ahead
  // of them. A very large sync lists only the first tasks; the count is exact.
  await commitWrites(db, [
    (batch) =>
      batch.set(doc(collection(db, Collections.workflowSyncs)), {
        workflowId: record.workflowId,
        workflowName: record.workflowName,
        byId: record.byId,
        taskIds: updates.slice(0, 500).map((entry) => entry.taskId),
        taskCount: updates.length,
        changes: record.changes.slice(0, 5),
        at: serverTime(),
      }),
  ]);
  return updates.length;
}
