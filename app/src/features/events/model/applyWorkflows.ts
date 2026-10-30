// File : /TeamSamsara.Workflow/app/src/features/events/model/applyWorkflows.ts
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : An event and its workflows → the tasks to make: each step with
// its exact due time (counted from the event's start in the workspace's time
// zone) and its {gaps} filled from the event. Gaps with no value stay as they
// are, so they're easy to spot and fix.

import type { TaskFields } from "@/features/tasks";
import {
  fillGaps,
  findGaps,
  resolveDue,
  type WorkflowRecord,
  type WorkflowStep,
} from "@/features/workflows";
import {
  formatDate,
  formatTime,
  type ClockFormat,
  type DateFormat,
} from "@/shared/time/dates";

export interface EventForTasks {
  title: string;
  startsAt: Date;
  link: string | null;
  details: Record<string, string>;
}

export interface Formats {
  timeZone: string;
  clock: ClockFormat;
  dateFormat: DateFormat;
}

/** A task to make for an event, with where it came from. */
export interface PlannedTask extends TaskFields {
  workflowId: string;
  stepId: string;
}

/** The values gaps fill with: the event's own, then the ones asked for. */
export function gapValues(
  event: EventForTasks,
  formats: Formats,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [gap, value] of Object.entries(event.details)) {
    if (value.trim()) values[gap.toLowerCase()] = value.trim();
  }
  if (event.title.trim()) values.title = event.title.trim();
  values.date = formatDate(
    event.startsAt,
    formats.timeZone,
    formats.dateFormat,
  );
  values.time = formatTime(event.startsAt, formats.timeZone, formats.clock);
  if (event.link?.trim()) values.link = event.link.trim();
  return values;
}

function taskFromStep(
  step: WorkflowStep,
  workflowId: string,
  event: EventForTasks,
  values: Record<string, string>,
  formats: Formats,
): PlannedTask {
  const fill = (text: string) => fillGaps(text, values);
  return {
    workflowId,
    stepId: step.id,
    title: fill(step.title),
    notes: fill(step.notes),
    workGroupId: step.workGroupId,
    memberId: step.memberId,
    dueAt: resolveDue(event.startsAt, step.due, formats.timeZone),
    needsApproval: step.needsApproval,
    tagIds: step.tagIds,
    posts:
      step.posts?.map((post) => ({
        ...post,
        texts: Object.fromEntries(
          Object.entries(post.texts).map(([field, text]) => [
            field,
            fill(text),
          ]),
        ),
      })) ?? null,
    checklist:
      step.checklist?.map((item) => ({
        id: item.id,
        text: fill(item.text),
        done: false,
      })) ?? null,
    links: step.links,
    asksForLiveLink: step.asksForLiveLink,
  };
}

/** Every task the workflows make for this event, earliest due first. */
export function applyWorkflows(
  event: EventForTasks,
  workflows: readonly WorkflowRecord[],
  formats: Formats,
): PlannedTask[] {
  const values = gapValues(event, formats);
  return workflows
    .flatMap((workflow) =>
      workflow.steps.map((step) =>
        taskFromStep(step, workflow.id, event, values, formats),
      ),
    )
    .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0));
}

/** The gaps these workflows ask the planner to fill (not the event's own). */
export function askedGaps(workflows: readonly WorkflowRecord[]): string[] {
  const own = new Set(["title", "date", "time", "link"]);
  const found = new Set<string>();
  for (const workflow of workflows) {
    for (const step of workflow.steps) {
      const texts = [
        step.title,
        step.notes,
        ...(step.checklist ?? []).map((item) => item.text),
        ...(step.posts ?? []).flatMap((post) => Object.values(post.texts)),
      ];
      for (const gap of texts.flatMap(findGaps))
        if (!own.has(gap)) found.add(gap);
    }
  }
  return [...found].sort();
}

/** "opponent" → "Opponent", "co_streamer" → "Co streamer". */
export function gapLabel(gap: string): string {
  const words = gap.replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
