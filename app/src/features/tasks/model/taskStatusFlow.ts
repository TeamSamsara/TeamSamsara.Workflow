// File : /TeamSamsara.Workflow/app/src/features/tasks/model/taskStatusFlow.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : What can happen next to a task, from the workspace's statuses and
// what the viewer may do: send it for review, mark it done, approve it, ask
// for changes, or reopen it. Each move goes to the status that fits by what
// it counts as, so renamed or reordered statuses keep working.

import type { StatusCategory, StatusRecord } from "@/core/data";
import type { TaskRecord } from "../types/taskTypes";

/** What the viewer may do with this task. */
export interface TaskAbilities {
  /** It's given to them or their group, and they may do assigned tasks. */
  canWork: boolean;
  canApprove: boolean;
}

export type TaskAction =
  | { kind: "sendForReview"; statusId: string }
  | { kind: "markDone"; statusId: string; blockedBy: "needsLiveLink" | null }
  | { kind: "approve"; statusId: string }
  | { kind: "askForChanges"; statusId: string }
  | { kind: "reopen"; statusId: string };

type TaskState = Pick<
  TaskRecord,
  "statusId" | "needsApproval" | "approvedAt" | "asksForLiveLink" | "liveLink"
>;

function ordered(statuses: readonly StatusRecord[]): StatusRecord[] {
  return [...statuses].sort((a, b) => a.position - b.position);
}

function first(statuses: readonly StatusRecord[], category: StatusCategory) {
  return ordered(statuses).find((status) => status.category === category);
}

export function statusOf(
  task: Pick<TaskRecord, "statusId">,
  statuses: readonly StatusRecord[],
): StatusRecord | undefined {
  return statuses.find((status) => status.id === task.statusId);
}

/** What the task's status counts as; open when its status was deleted. */
export function categoryOf(
  task: Pick<TaskRecord, "statusId">,
  statuses: readonly StatusRecord[],
): StatusCategory {
  return statusOf(task, statuses)?.category ?? "open";
}

/** Whether moving to this status counts as finishing the task. */
export function isDoneCategory(category: StatusCategory): boolean {
  return category === "finished" || category === "closed";
}

/** The status after this one that moves the task on (for Approve). */
function nextAfter(
  statusId: string,
  statuses: readonly StatusRecord[],
): StatusRecord | undefined {
  const list = ordered(statuses);
  const index = list.findIndex((status) => status.id === statusId);
  return list
    .slice(index + 1)
    .find(
      (status) => status.category === "open" || status.category === "finished",
    );
}

/** Whether it still needs a sign-off before it can be done. */
export function awaitsApproval(task: TaskState): boolean {
  return task.needsApproval && task.approvedAt === null;
}

export function nextActions(
  task: TaskState,
  statuses: readonly StatusRecord[],
  abilities: TaskAbilities,
): TaskAction[] {
  const category = categoryOf(task, statuses);
  const start = first(statuses, "open");
  const finished = first(statuses, "finished");
  const review = first(statuses, "awaitingApproval");
  const actions: TaskAction[] = [];

  if (category === "open" && abilities.canWork) {
    if (awaitsApproval(task)) {
      if (review) actions.push({ kind: "sendForReview", statusId: review.id });
    } else if (finished) {
      const missingLink = task.asksForLiveLink && !task.liveLink;
      actions.push({
        kind: "markDone",
        statusId: finished.id,
        blockedBy: missingLink ? "needsLiveLink" : null,
      });
    }
  }

  if (category === "awaitingApproval" && abilities.canApprove) {
    const onward = nextAfter(task.statusId, statuses) ?? finished;
    if (onward) actions.push({ kind: "approve", statusId: onward.id });
    if (start) actions.push({ kind: "askForChanges", statusId: start.id });
  }

  if (isDoneCategory(category) && abilities.canWork && start) {
    actions.push({ kind: "reopen", statusId: start.id });
  }

  return actions;
}

/** Whether a task needing approval can't move on: there's no status for it. */
export function missingReviewStatus(
  task: TaskState,
  statuses: readonly StatusRecord[],
): boolean {
  return awaitsApproval(task) && !first(statuses, "awaitingApproval");
}
