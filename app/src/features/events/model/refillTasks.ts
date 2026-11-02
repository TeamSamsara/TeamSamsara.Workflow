// File : /TeamSamsara.Workflow/app/src/features/events/model/refillTasks.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : When an event's fields change (or its title, time, link…), which
// of its tasks follow. Each piece of a task's text (title, notes, every
// checklist item and post text) is compared with its workflow step: if it
// still reads exactly as the old values filled it, it's filled again with the
// new ones. A piece someone edited by hand, a finished task, and a task whose
// step has changed since all stay as they are.

import type { TaskRecord } from "@/features/tasks";
import type { WorkflowRecord, WorkflowStep } from "@/features/workflows";
import {
  fillText,
  gapValues,
  type EventForTasks,
  type Formats,
} from "./applyWorkflows";

export type TaskPart = "title" | "notes" | "checklist" | "posts";

export type TaskTextChanges = Partial<
  Pick<TaskRecord, "title" | "notes" | "checklist" | "posts">
>;

export interface TaskRefill {
  taskId: string;
  /** The task's title once it's filled again. */
  title: string;
  changes: TaskTextChanges;
  parts: TaskPart[];
  /** Pieces that would have changed but were edited by hand, so they stay. */
  keptParts: TaskPart[];
}

export interface KeptTask {
  taskId: string;
  title: string;
  reason: "done" | "edited";
}

export interface RefillPlan {
  updates: TaskRefill[];
  kept: KeptTask[];
}

type Fill = (text: string) => string;

/** One piece: changed, kept (edited by hand) or untouched (doesn't use what changed). */
function piece(
  current: string,
  template: string,
  before: Fill,
  after: Fill,
): { next: string; outcome: "changed" | "kept" | "same" } {
  const old = before(template);
  const next = after(template);
  if (old === next) return { next: current, outcome: "same" };
  if (current !== old) return { next: current, outcome: "kept" };
  return { next, outcome: "changed" };
}

function refillTask(
  task: TaskRecord,
  step: WorkflowStep,
  before: Fill,
  after: Fill,
): { changes: TaskTextChanges; parts: TaskPart[]; keptParts: TaskPart[] } {
  const changes: TaskTextChanges = {};
  const parts = new Set<TaskPart>();
  const keptParts = new Set<TaskPart>();
  const note = (part: TaskPart, outcome: "changed" | "kept" | "same") => {
    if (outcome === "changed") parts.add(part);
    if (outcome === "kept") keptParts.add(part);
  };

  const title = piece(task.title, step.title, before, after);
  note("title", title.outcome);
  if (title.outcome === "changed") changes.title = title.next;

  const notes = piece(task.notes, step.notes, before, after);
  note("notes", notes.outcome);
  if (notes.outcome === "changed") changes.notes = notes.next;

  if (task.checklist && step.checklist) {
    let changed = false;
    const checklist = task.checklist.map((item) => {
      const source = step.checklist?.find((entry) => entry.id === item.id);
      if (!source) return item;
      const result = piece(item.text, source.text, before, after);
      note("checklist", result.outcome);
      if (result.outcome !== "changed") return item;
      changed = true;
      return { ...item, text: result.next };
    });
    if (changed) changes.checklist = checklist;
  }

  if (task.posts && step.posts) {
    let changed = false;
    const posts = task.posts.map((post, index) => {
      const source = step.posts?.[index];
      if (!source) return post;
      const texts = Object.fromEntries(
        Object.entries(post.texts).map(([key, text]) => {
          const template = source.texts[key];
          if (template === undefined) return [key, text];
          const result = piece(text, template, before, after);
          note("posts", result.outcome);
          if (result.outcome === "changed") changed = true;
          return [key, result.next];
        }),
      );
      return { ...post, texts };
    });
    if (changed) changes.posts = posts;
  }

  return { changes, parts: [...parts], keptParts: [...keptParts] };
}

/** What changing the event from `before` to `after` does to its tasks. */
export function planRefill(
  tasks: readonly TaskRecord[],
  workflows: readonly WorkflowRecord[],
  before: EventForTasks,
  after: EventForTasks,
  formats: Formats,
): RefillPlan {
  const oldValues = gapValues(before, formats);
  const newValues = gapValues(after, formats);
  const fillBefore: Fill = (text) => fillText(text, oldValues, formats.fields);
  const fillAfter: Fill = (text) => fillText(text, newValues, formats.fields);
  const plan: RefillPlan = { updates: [], kept: [] };

  for (const task of tasks) {
    const step = workflows
      .find((workflow) => workflow.id === task.workflowId)
      ?.steps.find((entry) => entry.id === task.stepId);
    if (!step) continue;
    const result = refillTask(task, step, fillBefore, fillAfter);
    const wouldChange = result.parts.length + result.keptParts.length > 0;
    if (!wouldChange) continue;
    if (task.doneAt) {
      plan.kept.push({ taskId: task.id, title: task.title, reason: "done" });
    } else if (result.parts.length === 0) {
      plan.kept.push({ taskId: task.id, title: task.title, reason: "edited" });
    } else {
      plan.updates.push({
        taskId: task.id,
        title: result.changes.title ?? task.title,
        ...result,
      });
    }
  }
  return plan;
}
