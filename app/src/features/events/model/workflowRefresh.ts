// File : /TeamSamsara.Workflow/app/src/features/events/model/workflowRefresh.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Brings one event's tasks back in line with its workflows as they
// are now: an event planned before a step got its post text, checklist or new
// wording. Each open task is compared with what its step makes for this event
// today; finished tasks are left alone. Ticks on checklist items that are
// still there are kept, and items added to the task by hand stay at the end.
// Steps added since the event was planned can be made as new tasks.

import type { TaskRecord } from "@/features/tasks";
import type { PlatformPost, WorkflowRecord } from "@/features/workflows";
import {
  applyWorkflows,
  type EventForTasks,
  type Formats,
  type PlannedTask,
} from "./applyWorkflows";

export type RefreshPart = "title" | "notes" | "checklist" | "posts" | "due";

type TextChanges = Partial<
  Pick<TaskRecord, "title" | "notes" | "checklist" | "posts">
>;

export interface TaskRefresh {
  taskId: string;
  /** Its title now, to list it by. */
  title: string;
  /** What differs from its step, due time included. */
  parts: RefreshPart[];
  changes: TextChanges;
  /** The step's due time, when it differs from the task's. */
  toDue?: Date | null;
}

export interface RefreshPlan {
  updates: TaskRefresh[];
  /** Steps with no task on this event (added since, or deleted by hand). */
  newSteps: PlannedTask[];
}

function samePosts(
  a: readonly PlatformPost[] | null,
  b: readonly PlatformPost[] | null,
): boolean {
  const left = a ?? [];
  const right = b ?? [];
  return (
    left.length === right.length &&
    left.every((post, index) => {
      const other = right[index];
      const keys = Object.keys(post.texts);
      return (
        post.platformId === other.platformId &&
        (post.formatId ?? null) === (other.formatId ?? null) &&
        keys.length === Object.keys(other.texts).length &&
        keys.every((key) => post.texts[key] === other.texts[key])
      );
    })
  );
}

/** The step's checklist with the task's ticks, then the task's own items. */
function mergedChecklist(
  task: TaskRecord,
  planned: PlannedTask,
): TaskRecord["checklist"] {
  if (!planned.checklist) return task.checklist;
  const fromStep = new Set(planned.checklist.map((item) => item.id));
  return [
    ...planned.checklist.map((item) => ({
      ...item,
      done: task.checklist?.find((own) => own.id === item.id)?.done ?? false,
    })),
    ...(task.checklist ?? []).filter((item) => !fromStep.has(item.id)),
  ];
}

const sameChecklist = (
  a: TaskRecord["checklist"],
  b: TaskRecord["checklist"],
) =>
  (a ?? []).length === (b ?? []).length &&
  (a ?? []).every(
    (item, index) =>
      item.id === b?.[index].id &&
      item.text === b[index].text &&
      item.done === b[index].done,
  );

export function planWorkflowRefresh(
  event: EventForTasks & { workflowIds: readonly string[] },
  workflows: readonly WorkflowRecord[],
  tasks: readonly TaskRecord[],
  formats: Formats,
): RefreshPlan {
  const used = event.workflowIds.flatMap((id) => {
    const found = workflows.find((workflow) => workflow.id === id);
    return found ? [found] : [];
  });
  const plan: RefreshPlan = { updates: [], newSteps: [] };
  for (const planned of applyWorkflows(event, used, formats)) {
    const task = tasks.find(
      (entry) =>
        entry.workflowId === planned.workflowId &&
        entry.stepId === planned.stepId,
    );
    if (!task) {
      plan.newSteps.push(planned);
      continue;
    }
    if (task.doneAt) continue;

    const changes: TextChanges = {};
    const parts: RefreshPart[] = [];
    if (planned.title !== task.title) {
      changes.title = planned.title;
      parts.push("title");
    }
    if (planned.notes !== task.notes) {
      changes.notes = planned.notes;
      parts.push("notes");
    }
    const checklist = mergedChecklist(task, planned);
    if (!sameChecklist(checklist, task.checklist)) {
      changes.checklist = checklist;
      parts.push("checklist");
    }
    if (planned.posts && !samePosts(planned.posts, task.posts)) {
      changes.posts = planned.posts;
      parts.push("posts");
    }
    const dueMoves =
      (planned.dueAt?.getTime() ?? null) !== (task.dueAt?.getTime() ?? null);
    if (dueMoves) parts.push("due");
    if (parts.length === 0) continue;
    plan.updates.push({
      taskId: task.id,
      title: task.title,
      parts,
      changes,
      ...(dueMoves ? { toDue: planned.dueAt } : {}),
    });
  }
  return plan;
}

/** The fields to write for a refresh, with or without its due time. */
export function refreshWrite(
  refresh: TaskRefresh,
  withDue: boolean,
): TextChanges & { dueAt?: Date | null } {
  return withDue && refresh.toDue !== undefined
    ? { ...refresh.changes, dueAt: refresh.toDue }
    : refresh.changes;
}
