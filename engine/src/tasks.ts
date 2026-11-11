// File : /TeamSamsara.Workflow/engine/src/tasks.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : An event and its workflows → the tasks to make: each step with
// its exact due time (counted from the event's start in the workspace's time
// zone) and its {fields} filled from the event, each the way its type reads
// (a person by name, a date in the workspace's format). A field with no value
// yet shows as its name in brackets, "[Match link]", easy to spot and filled
// in when the event gets it. Moved here from the app so the server makes and
// updates tasks exactly the same way.

import { resolveDue, type DueOffset } from "./due.js";
import { fieldText } from "./fieldText.js";
import { fillGaps, findGaps, nameFromKey } from "./gaps.js";
import {
  formatDate,
  formatTime,
  type ClockFormat,
  type DateFormat,
} from "./time.js";

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface TaskChecklistItem extends ChecklistItem {
  done: boolean;
}

export interface ReferenceLink {
  label: string;
  url: string;
}

/** The text for one platform, e.g. X (or an X Article), keyed by field. */
export interface PlatformPost {
  platformId: string;
  /** A paid-tier format such as "article", or null for a normal post. */
  formatId: string | null;
  texts: Record<string, string>;
}

/** A workflow's step, as much of it as makes a task. */
export interface StepForTasks {
  id: string;
  title: string;
  notes: string;
  workGroupId: string | null;
  memberId: string | null;
  due: DueOffset;
  needsApproval: boolean;
  tagIds: string[];
  posts: PlatformPost[] | null;
  checklist: ChecklistItem[] | null;
  links: ReferenceLink[] | null;
  asksForLiveLink: boolean;
}

export interface WorkflowForTasks {
  id: string;
  steps: readonly StepForTasks[];
}

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

/** A field as text reads it: its key, its name and its type. */
export interface FieldForText {
  id: string;
  name: string;
  type: string;
}

export interface Formats {
  timeZone: string;
  clock: ClockFormat;
  dateFormat: DateFormat;
  /** The workspace's fields, so each value reads the way its type does. */
  fields?: readonly FieldForText[];
  /** A member's name, for person fields. */
  memberName?: (memberId: string) => string | null;
  /** An event type's name, for {event_type}. */
  eventTypeName?: (eventTypeId: string) => string | null;
}

/** A task to make for an event, with where it came from. */
export interface PlannedTask {
  workflowId: string;
  stepId: string;
  title: string;
  notes: string;
  workGroupId: string | null;
  memberId: string | null;
  dueAt: Date | null;
  needsApproval: boolean;
  tagIds: string[];
  posts: PlatformPost[] | null;
  checklist: TaskChecklistItem[] | null;
  links: ReferenceLink[] | null;
  asksForLiveLink: boolean;
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
  fields: readonly FieldForText[] = [],
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

/** One step's task for an event, with its values already worked out. */
export function taskFromStep(
  step: StepForTasks,
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
  workflows: readonly WorkflowForTasks[],
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
