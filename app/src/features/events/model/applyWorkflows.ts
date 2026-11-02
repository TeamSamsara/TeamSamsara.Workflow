// File : /TeamSamsara.Workflow/app/src/features/events/model/applyWorkflows.ts
// Version : 1.1.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : An event and its workflows → the tasks to make: each step with
// its exact due time (counted from the event's start in the workspace's time
// zone) and its {fields} filled from the event, each the way its type reads
// (a person by name, a date in the workspace's format). A field with no value
// yet shows as its name in brackets, "[Match link]", easy to spot and filled
// in when the event gets it (see refillTasks).

import {
  BuiltInFieldKeys,
  fieldText,
  nameFromKey,
  type FieldRecord,
} from "@/features/fields";
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
  /** For {end_time}; left out where there's none yet. */
  endsAt?: Date;
  /** For {event_type}. */
  eventTypeId?: string | null;
  link: string | null;
  details: Record<string, string>;
}

export interface Formats {
  timeZone: string;
  clock: ClockFormat;
  dateFormat: DateFormat;
  /** The workspace's fields, so each value reads the way its type does. */
  fields?: readonly FieldRecord[];
  /** A member's name, for person fields. */
  memberName?: (memberId: string) => string | null;
  /** An event type's name, for {event_type}. */
  eventTypeName?: (eventTypeId: string) => string | null;
}

/** A task to make for an event, with where it came from. */
export interface PlannedTask extends TaskFields {
  workflowId: string;
  stepId: string;
}

/** The values fields fill with: the ones asked for, then the event's own. */
export function gapValues(
  event: EventForTasks,
  formats: Formats,
): Record<string, string> {
  const byKey = new Map(formats.fields?.map((field) => [field.id, field]));
  const values: Record<string, string> = {};
  for (const [gap, value] of Object.entries(event.details)) {
    const key = gap.toLowerCase();
    const text = fieldText(byKey.get(key), value, formats);
    if (text) values[key] = text;
  }
  if (event.title.trim()) values.title = event.title.trim();
  values.date = formatDate(
    event.startsAt,
    formats.timeZone,
    formats.dateFormat,
  );
  values.time = formatTime(event.startsAt, formats.timeZone, formats.clock);
  if (event.endsAt)
    values.end_time = formatTime(event.endsAt, formats.timeZone, formats.clock);
  if (event.link?.trim()) values.link = event.link.trim();
  const type = event.eventTypeId
    ? formats.eventTypeName?.(event.eventTypeId)
    : null;
  if (type) values.event_type = type;
  return values;
}

/** How a value reads in a title or a task: a person by name, a date in its format. */
export type ValueText = (key: string, value: string) => string;

export function valueText(formats: Formats): ValueText {
  return (key, value) =>
    fieldText(
      formats.fields?.find((field) => field.id === key),
      value,
      formats,
    ) || value;
}

/** Fills a text's fields; one with no value shows as "[Its name]". */
export function fillText(
  text: string,
  values: Readonly<Record<string, string>>,
  fields: readonly FieldRecord[] = [],
): string {
  const missing = findGaps(text).filter((gap) => values[gap] === undefined);
  if (missing.length === 0) return fillGaps(text, values);
  const names = Object.fromEntries(
    missing.map((gap) => [
      gap,
      `[${fields.find((field) => field.id === gap)?.name ?? nameFromKey(gap)}]`,
    ]),
  );
  return fillGaps(text, { ...names, ...values });
}

function taskFromStep(
  step: WorkflowStep,
  workflowId: string,
  event: EventForTasks,
  values: Record<string, string>,
  formats: Formats,
): PlannedTask {
  const fill = (text: string) => fillText(text, values, formats.fields);
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
  const own = new Set<string>(BuiltInFieldKeys);
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

/** A field's name: its own, or "Co streamer" from {co_streamer} when it has none. */
export function gapLabel(
  gap: string,
  fields: readonly FieldRecord[] = [],
): string {
  return fields.find((field) => field.id === gap)?.name ?? nameFromKey(gap);
}
