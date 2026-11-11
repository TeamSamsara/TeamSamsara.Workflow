// File : /TeamSamsara.Workflow/app/src/features/events/model/lateTasks.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : When planning, the tasks whose due time has already passed: an
// event planned the night before still gets its "2 days before" tasks, so the
// planner chooses to make them as late ("Late from the start") or leave them
// out.

import type { WorkflowRecord } from "@/features/workflows";
import {
  applyWorkflows,
  type EventForTasks,
  type Formats,
  type PlannedTask,
} from "./applyWorkflows";

/** What to do with tasks that would be late from the start. */
export type LateChoice = "late" | "skip";

export interface LateTask {
  title: string;
  dueAt: Date;
  eventTitle: string;
  eventStart: Date;
}

/** Whether a task due then is already late when it's made now. */
export function isLateAtCreation(dueAt: Date | null, now: Date): boolean {
  return dueAt !== null && dueAt.getTime() < now.getTime();
}

/** The planned tasks of one event that are already late. */
export function lateOf(
  planned: readonly PlannedTask[],
  event: Pick<EventForTasks, "title" | "startsAt">,
  now: Date,
): LateTask[] {
  return planned.flatMap((task) =>
    task.dueAt && isLateAtCreation(task.dueAt, now)
      ? [
          {
            title: task.title,
            dueAt: task.dueAt,
            eventTitle: event.title,
            eventStart: event.startsAt,
          },
        ]
      : [],
  );
}

/** Every already-late task across these events, earliest due first. */
export function findLateTasks(
  events: readonly EventForTasks[],
  workflows: readonly WorkflowRecord[],
  formats: Formats,
  now: Date,
): LateTask[] {
  return events
    .flatMap((event) =>
      lateOf(applyWorkflows(event, workflows, formats), event, now),
    )
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}
