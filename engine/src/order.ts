// File : /TeamSamsara.Workflow/engine/src/order.ts
// Version : 1.0.0
// Latest commit: feature/1.2-tasks-follow-order
// Author : Gerrah
// Purpose : The order between a workflow's steps, and what it means for the
// tasks they make. A step's order rules become links (this one follows that
// one, and what has to happen first). Each task is made knowing what it waits
// on; it stays locked until that happens (all of it, or any one), unless it's
// late and set to unlock at its own due time, or someone started it anyway
// and said why. Shared by the app and the server so both lock tasks the same
// way.

import { resolveDue, type DueOffset } from "./due.js";

export const OrderRelations = ["after", "before", "with", "dueFrom"] as const;
export type OrderRelation = (typeof OrderRelations)[number];

export const OrderConditions = [
  "done",
  "approved",
  "inReview",
  "liveLink",
  "order",
] as const;
export type OrderCondition = (typeof OrderConditions)[number];

export interface OrderRule {
  id: string;
  relation: OrderRelation;
  /** The other step; empty until one is picked. */
  stepId: string;
  condition: OrderCondition;
}

export const WaitForChoices = ["all", "any"] as const;
export type WaitFor = (typeof WaitForChoices)[number];

export const WhenLateChoices = ["wait", "unlock"] as const;
export type WhenLate = (typeof WhenLateChoices)[number];

export const Priorities = ["high", "normal", "low"] as const;
export type Priority = (typeof Priorities)[number];

/** As much of a step as its order reads. */
export interface StepForOrder {
  id: string;
  order: readonly OrderRule[];
}

/** One link: `to` follows `from`, and `condition` says what has to happen. */
export interface OrderLink {
  from: string;
  to: string;
  condition: OrderCondition;
  /** "dueFrom": the follower's due time counts from when `from` is done. */
  dueFrom: boolean;
  /** The step and rule it was written on, so the editor can point at it. */
  ownerId: string;
  ruleId: string;
}

/** Whether a condition locks the step that follows until it happens. */
export function locks(condition: OrderCondition): boolean {
  return condition !== "order";
}

/** Every link the steps' rules make ("with" rules make none: they're not an order). */
export function orderLinks(steps: readonly StepForOrder[]): OrderLink[] {
  const ids = new Set(steps.map((step) => step.id));
  const links: OrderLink[] = [];
  for (const step of steps) {
    for (const rule of step.order) {
      if (!rule.stepId || rule.stepId === step.id || !ids.has(rule.stepId))
        continue;
      if (rule.relation === "with") continue;
      const before = rule.relation === "before";
      links.push({
        from: before ? step.id : rule.stepId,
        to: before ? rule.stepId : step.id,
        condition: rule.relation === "dueFrom" ? "done" : rule.condition,
        dueFrom: rule.relation === "dueFrom",
        ownerId: step.id,
        ruleId: rule.id,
      });
    }
  }
  return links;
}

/** A step its task comes after, written on the task when it's made. */
export interface TaskWait {
  stepId: string;
  condition: OrderCondition;
  /** Its due time counts from when that step's task is done. */
  dueFrom: boolean;
}

/** The steps a step comes after, one entry each (the strongest condition wins). */
export function waitsOf(
  steps: readonly StepForOrder[],
  stepId: string,
): TaskWait[] {
  const waits = new Map<string, TaskWait>();
  for (const link of orderLinks(steps)) {
    if (link.to !== stepId) continue;
    const had = waits.get(link.from);
    waits.set(link.from, {
      stepId: link.from,
      condition:
        had && locks(had.condition) && !locks(link.condition)
          ? had.condition
          : link.condition,
      dueFrom: (had?.dueFrom ?? false) || link.dueFrom,
    });
  }
  return [...waits.values()];
}

/** As much of a task as another task's order reads. */
export interface TaskForOrder {
  id: string;
  title: string;
  workflowId: string | null;
  stepId: string | null;
  doneAt: Date | null;
  approvedAt: Date | null;
  sentForReviewAt: Date | null;
  liveLink: string | null;
}

/** Whether a task has done what a condition asks. */
export function conditionMet(
  condition: OrderCondition,
  task: TaskForOrder,
): boolean {
  switch (condition) {
    case "order":
      return true;
    case "done":
      return task.doneAt !== null;
    case "approved":
      return task.approvedAt !== null;
    case "inReview":
      return task.sentForReviewAt !== null || task.approvedAt !== null;
    case "liveLink":
      return Boolean(task.liveLink?.trim());
  }
}

/** Someone started a locked task anyway, and why. */
export interface StartedAnyway {
  by: string;
  at: Date | null;
  reason: string;
}

/**
 * A task it still waits on, kept on the task by the server so whoever has it
 * sees what it's waiting for, even a task they can't open.
 */
export interface WaitingOn {
  taskId: string;
  stepId: string;
  title: string;
  condition: OrderCondition;
}

/** As much of a task as working out whether it's locked reads. */
export interface WaitingTask {
  id: string;
  workflowId: string | null;
  waitsOn: readonly TaskWait[];
  waitFor: WaitFor;
  whenLate: WhenLate;
  dueAt: Date | null;
  doneAt: Date | null;
  startedAnyway: StartedAnyway | null;
}

/**
 * What a task still waits on, given the other tasks of its event: each task
 * a locking wait points at that hasn't done what it asks. A task that no
 * longer exists doesn't hold it. Empty once it no longer waits: all of them
 * done, or, when it waits for any one, as soon as one is. So a task is
 * waiting exactly when this isn't empty, which the database rules can check
 * on the task alone.
 */
export function waitingOnOf(
  task: WaitingTask,
  siblings: readonly TaskForOrder[],
): WaitingOn[] {
  if (!task.workflowId) return [];
  const holding = task.waitsOn
    .filter((wait) => locks(wait.condition))
    .flatMap((wait) => {
      const other = siblings.find(
        (entry) =>
          entry.id !== task.id &&
          entry.workflowId === task.workflowId &&
          entry.stepId === wait.stepId,
      );
      return other ? [{ wait, other }] : [];
    });
  const unmet = holding.filter(
    ({ wait, other }) => !conditionMet(wait.condition, other),
  );
  if (task.waitFor === "any" && unmet.length < holding.length) return [];
  return unmet.map(({ wait, other }) => ({
    taskId: other.id,
    stepId: wait.stepId,
    title: other.title,
    condition: wait.condition,
  }));
}

/**
 * What a task waits on as it's made, from the other tasks of its event: the
 * ones already there and the ones made with it (new, so nothing done yet).
 */
export function waitingOnAtCreation(
  task: Pick<WaitingTask, "id" | "workflowId" | "waitsOn" | "waitFor">,
  others: readonly TaskForOrder[],
): WaitingOn[] {
  return waitingOnOf(
    {
      ...task,
      whenLate: "wait",
      dueAt: null,
      doneAt: null,
      startedAnyway: null,
    },
    others,
  );
}

/** A task about to be made, as the order of the others reads it. */
export function freshTask(
  id: string,
  task: { title: string; workflowId: string; stepId: string },
): TaskForOrder {
  return {
    id,
    title: task.title,
    workflowId: task.workflowId,
    stepId: task.stepId,
    doneAt: null,
    approvedAt: null,
    sentForReviewAt: null,
    liveLink: null,
  };
}

export interface LockState {
  locked: boolean;
  /** Unlocked because it's late and set to unlock at its due time. */
  unlockedLate: boolean;
}

/**
 * Whether a task is locked, from what it still waits on (see waitingOnOf),
 * unless it's late and set to unlock, or someone started it anyway. The
 * database rules check the same (isLockedTask in firestore.rules).
 */
export function lockState(
  task: Pick<WaitingTask, "whenLate" | "dueAt" | "doneAt" | "startedAnyway"> & {
    waitingOn: readonly unknown[];
  },
  now: Date,
): LockState {
  const open = { locked: false, unlockedLate: false };
  if (task.doneAt || task.startedAnyway || task.waitingOn.length === 0)
    return open;
  if (
    task.whenLate === "unlock" &&
    task.dueAt !== null &&
    task.dueAt.getTime() <= now.getTime()
  )
    return { locked: false, unlockedLate: true };
  return { locked: true, unlockedLate: false };
}

export interface WaitState extends LockState {
  /** The tasks it still waits on. */
  waitingOn: WaitingOn[];
}

/** Whether a task is locked, given the other tasks of its event. */
export function waitState(
  task: WaitingTask,
  siblings: readonly TaskForOrder[],
  now: Date,
): WaitState {
  const waitingOn = task.doneAt ? [] : waitingOnOf(task, siblings);
  return { ...lockState({ ...task, waitingOn }, now), waitingOn };
}

/**
 * The tasks a change to `changed` unlocks: those that were locked before it
 * and aren't any more. `before` is the changed task as it was.
 */
export function unlockedBy(
  before: TaskForOrder,
  changed: TaskForOrder,
  tasks: readonly (TaskForOrder & WaitingTask)[],
  now: Date,
): (TaskForOrder & WaitingTask)[] {
  const was = tasks.map((task) => (task.id === changed.id ? before : task));
  const is = tasks.map((task) => (task.id === changed.id ? changed : task));
  return tasks.filter(
    (task) =>
      task.id !== changed.id &&
      task.waitsOn.some((wait) => wait.stepId === changed.stepId) &&
      waitState(task, was, now).locked &&
      !waitState(task, is, now).locked,
  );
}

/**
 * A Due from task's due time once the task it counts from is done: the
 * step's offset counted forward from that moment ("1 day after at 1:00 PM").
 */
export function dueFromDone(
  doneAt: Date,
  offset: DueOffset,
  timeZone: string,
): Date {
  return resolveDue(doneAt, { ...offset, direction: "after" }, timeZone);
}
