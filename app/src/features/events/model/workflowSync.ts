// File : /TeamSamsara.Workflow/app/src/features/events/model/workflowSync.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : When a workflow is saved, which tasks it already made for
// upcoming events follow the new version. Each piece of a task (its due time,
// title, notes, checklist and post text) is compared with what the old version
// of its step made for that event: if it still matches, it takes what the new
// version makes; if someone changed it by hand, it stays. This works the same
// for tasks made before this check existed, so nothing is moved on a guess.
// Finished tasks and tasks whose step was removed are left alone, and a task
// whose new due time has already passed is listed apart so the planner
// decides.

import type { TaskRecord } from "@/features/tasks";
import {
  describeDue,
  resolveDue,
  type WorkflowRecord,
  type WorkflowStep,
} from "@/features/workflows";
import type { ClockFormat } from "@/shared/time/dates";
import {
  fillText,
  gapValues,
  type EventForTasks,
  type Formats,
} from "./applyWorkflows";

export type SyncPart = "due" | "title" | "notes" | "checklist" | "posts";

export type SyncChanges = Partial<
  Pick<TaskRecord, "dueAt" | "title" | "notes" | "checklist" | "posts">
>;

/** An upcoming event the workflow made tasks for. */
export interface SyncEvent extends EventForTasks {
  id: string;
}

export interface SyncUpdate {
  taskId: string;
  eventId: string;
  eventTitle: string;
  eventStart: Date;
  /** The task's title once it's updated. */
  title: string;
  /** Its due time now. */
  fromDue: Date | null;
  /** Its due time after the update (the same when only text changes). */
  toDue: Date | null;
  changes: SyncChanges;
  parts: SyncPart[];
  /** Pieces that would have changed but were edited by hand, so they stay. */
  keptParts: SyncPart[];
}

export type LeftAloneReason = "done" | "edited" | "stepRemoved";

export interface SyncLeftAlone {
  taskId: string;
  eventTitle: string;
  title: string;
  reason: LeftAloneReason;
  /** For "edited": which pieces were changed by hand. */
  parts: SyncPart[];
}

export interface SyncPlan {
  update: SyncUpdate[];
  /** Updates whose new due time has already passed (while the old one hasn't). */
  alreadyLate: SyncUpdate[];
  leftAlone: SyncLeftAlone[];
}

type Outcome<T> =
  { kind: "same" } | { kind: "kept" } | { kind: "changed"; next: T };

/** One piece: what the old step made, what the new one makes, what it says now. */
function compare<T>(
  current: T,
  before: T,
  after: T,
  equal: (a: T, b: T) => boolean,
): Outcome<T> {
  if (equal(before, after)) return { kind: "same" };
  if (!equal(current, before)) return { kind: "kept" };
  return { kind: "changed", next: after };
}

const sameText = (a: string, b: string) => a === b;

const sameTime = (a: Date | null, b: Date | null) =>
  (a?.getTime() ?? null) === (b?.getTime() ?? null);

type Checklist = TaskRecord["checklist"];
type Posts = TaskRecord["posts"];

/** Checklists match when they have the same items with the same text (ticks aside). */
function sameChecklist(a: Checklist, b: Checklist): boolean {
  if (!a || !b) return a === b || (!a?.length && !b?.length);
  return (
    a.length === b.length &&
    a.every((item, index) => {
      const other = b[index];
      return (
        other !== undefined && item.id === other.id && item.text === other.text
      );
    })
  );
}

function samePosts(a: Posts, b: Posts): boolean {
  if (!a || !b) return a === b || (!a?.length && !b?.length);
  return (
    a.length === b.length &&
    a.every((post, index) => {
      const other = b[index];
      if (!other) return false;
      if (post.platformId !== other.platformId) return false;
      if (post.formatId !== other.formatId) return false;
      const keys = Object.keys(post.texts);
      return (
        keys.length === Object.keys(other.texts).length &&
        keys.every((key) => post.texts[key] === other.texts[key])
      );
    })
  );
}

type Fill = (text: string) => string;

function filledChecklist(step: WorkflowStep, fill: Fill): Checklist {
  return (
    step.checklist?.map((item) => ({
      id: item.id,
      text: fill(item.text),
      done: false,
    })) ?? null
  );
}

function filledPosts(step: WorkflowStep, fill: Fill): Posts {
  return (
    step.posts?.map((post) => ({
      ...post,
      texts: Object.fromEntries(
        Object.entries(post.texts).map(([key, text]) => [key, fill(text)]),
      ),
    })) ?? null
  );
}

/** The new checklist, keeping the ticks of items that are still there. */
function keepTicks(next: Checklist, current: Checklist): Checklist {
  if (!next) return null;
  return next.map((item) => ({
    ...item,
    done: current?.find((entry) => entry.id === item.id)?.done ?? false,
  }));
}

interface TaskOutcome {
  changes: SyncChanges;
  parts: SyncPart[];
  keptParts: SyncPart[];
}

function compareTask(
  task: TaskRecord,
  before: WorkflowStep,
  after: WorkflowStep,
  event: SyncEvent,
  formats: Formats,
): TaskOutcome {
  const values = gapValues(event, formats);
  const fill: Fill = (text) => fillText(text, values, formats.fields);
  const result: TaskOutcome = { changes: {}, parts: [], keptParts: [] };
  const note = <T>(
    part: SyncPart,
    outcome: Outcome<T>,
    set: (next: T) => void,
  ) => {
    if (outcome.kind === "kept") result.keptParts.push(part);
    if (outcome.kind === "changed") {
      result.parts.push(part);
      set(outcome.next);
    }
  };

  note(
    "due",
    compare(
      task.dueAt,
      resolveDue(event.startsAt, before.due, formats.timeZone),
      resolveDue(event.startsAt, after.due, formats.timeZone),
      sameTime,
    ),
    (next) => (result.changes.dueAt = next),
  );
  note(
    "title",
    compare(task.title, fill(before.title), fill(after.title), sameText),
    (next) => (result.changes.title = next),
  );
  note(
    "notes",
    compare(task.notes, fill(before.notes), fill(after.notes), sameText),
    (next) => (result.changes.notes = next),
  );
  note(
    "checklist",
    compare(
      task.checklist,
      filledChecklist(before, fill),
      filledChecklist(after, fill),
      sameChecklist,
    ),
    (next) => (result.changes.checklist = keepTicks(next, task.checklist)),
  );
  note(
    "posts",
    compare(
      task.posts,
      filledPosts(before, fill),
      filledPosts(after, fill),
      samePosts,
    ),
    (next) => (result.changes.posts = next),
  );
  return result;
}

function findStep(
  workflow: WorkflowRecord,
  stepId: string | null,
): WorkflowStep | undefined {
  return workflow.steps.find((step) => step.id === stepId);
}

/**
 * What saving the workflow (from `before` to `after`) does to the tasks it
 * made for upcoming events. Tasks for events not in `events` (past ones, or
 * other workflows') aren't listed at all.
 */
export function planWorkflowSync(
  before: WorkflowRecord,
  after: WorkflowRecord,
  tasks: readonly TaskRecord[],
  events: readonly SyncEvent[],
  formats: Formats,
  now: Date,
): SyncPlan {
  const plan: SyncPlan = { update: [], alreadyLate: [], leftAlone: [] };
  const eventsById = new Map(events.map((event) => [event.id, event]));

  for (const task of tasks) {
    if (task.workflowId !== after.id || !task.eventId) continue;
    const event = eventsById.get(task.eventId);
    if (!event || event.startsAt.getTime() < now.getTime()) continue;
    const oldStep = findStep(before, task.stepId);
    if (!oldStep) continue;
    const base = {
      taskId: task.id,
      eventTitle: event.title,
      title: task.title,
    };
    const newStep = findStep(after, task.stepId);
    if (!newStep) {
      plan.leftAlone.push({ ...base, reason: "stepRemoved", parts: [] });
      continue;
    }

    const outcome = compareTask(task, oldStep, newStep, event, formats);
    if (outcome.parts.length + outcome.keptParts.length === 0) continue;
    if (task.doneAt) {
      plan.leftAlone.push({ ...base, reason: "done", parts: [] });
      continue;
    }
    if (outcome.parts.length === 0) {
      plan.leftAlone.push({
        ...base,
        reason: "edited",
        parts: outcome.keptParts,
      });
      continue;
    }

    const toDue =
      outcome.changes.dueAt !== undefined ? outcome.changes.dueAt : task.dueAt;
    const update: SyncUpdate = {
      taskId: task.id,
      eventId: event.id,
      eventTitle: event.title,
      eventStart: event.startsAt,
      title: outcome.changes.title ?? task.title,
      fromDue: task.dueAt,
      toDue,
      ...outcome,
    };
    const becomesLate =
      outcome.changes.dueAt !== undefined &&
      toDue !== null &&
      toDue.getTime() < now.getTime() &&
      (task.dueAt === null || task.dueAt.getTime() >= now.getTime());
    (becomesLate ? plan.alreadyLate : plan.update).push(update);
  }

  const byDue = (a: SyncUpdate, b: SyncUpdate) =>
    (a.toDue?.getTime() ?? 0) - (b.toDue?.getTime() ?? 0);
  plan.update.sort(byDue);
  plan.alreadyLate.sort(byDue);
  return plan;
}

/** The changes to write for an update; a late one keeps its due time unless moved anyway. */
export function changesToWrite(
  update: SyncUpdate,
  moveAnyway: boolean,
): SyncChanges {
  if (moveAnyway) return update.changes;
  const rest = { ...update.changes };
  delete rest.dueAt;
  return rest;
}

/** Whether the plan has anything to show. */
export function hasSyncWork(plan: SyncPlan): boolean {
  return (
    plan.update.length + plan.alreadyLate.length + plan.leftAlone.length > 0
  );
}

/** What changed in each step that's in both versions, a line each. */
export function describeStepChanges(
  before: WorkflowRecord,
  after: WorkflowRecord,
  clock: ClockFormat,
  text: {
    due: (title: string, due: string) => string;
    wording: (title: string) => string;
  },
): string[] {
  return after.steps.flatMap((step) => {
    const old = findStep(before, step.id);
    if (!old) return [];
    const title = step.title.trim() || old.title.trim();
    const oldDue = describeDue(old.due, clock);
    const newDue = describeDue(step.due, clock);
    if (oldDue !== newDue)
      return [
        text.due(title, newDue.charAt(0).toLowerCase() + newDue.slice(1)),
      ];
    const sameWording =
      old.title === step.title &&
      old.notes === step.notes &&
      sameChecklist(
        filledChecklist(old, (value) => value),
        filledChecklist(step, (value) => value),
      ) &&
      samePosts(
        filledPosts(old, (value) => value),
        filledPosts(step, (value) => value),
      );
    return sameWording ? [] : [text.wording(title)];
  });
}
