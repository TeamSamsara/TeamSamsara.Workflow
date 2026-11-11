// File : /TeamSamsara.Workflow/app/src/features/events/model/setEdit.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : What filling in or changing fields does to events of a set, one
// at a time from the set's table or all at once from Edit set. Each event
// takes the new values; a title that still follows the set's pattern is
// filled again (or follows a new pattern), and its tasks' text follows the
// way it does when one event is edited: pieces changed by hand and finished
// tasks stay as they are.

import type { TaskRecord } from "@/features/tasks";
import { fillGaps, type WorkflowRecord } from "@/features/workflows";
import type { EventRecord } from "../types/eventTypes";
import { EventLimits } from "../types/eventTypes";
import { valueText, type Formats } from "./applyWorkflows";
import { editableTitle, filledDetails } from "./eventDraft";
import { planRefill, type TaskRefill } from "./refillTasks";

export interface DetailsChange {
  /** Fields to set, by key; an empty value clears one. */
  details: Readonly<Record<string, string>>;
  /** The set's title pattern now, if it has one. */
  pattern: string | null;
  /** Its new pattern, when that changes too. */
  newPattern?: string;
}

export interface EventEdit {
  eventId: string;
  title: string;
  details: Record<string, string>;
  /** Its tasks whose text follows. */
  refills: TaskRefill[];
}

function tidyDetails(
  details: Readonly<Record<string, string>>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(details)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== ""),
  );
}

const sameDetails = (
  a: Readonly<Record<string, string>>,
  b: Readonly<Record<string, string>>,
) => {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
};

/** What the change does to one event; null when it doesn't change it. */
export function planEventEdit(
  event: EventRecord,
  change: DetailsChange,
  tasks: readonly TaskRecord[],
  workflows: readonly WorkflowRecord[],
  formats: Formats,
): EventEdit | null {
  const text = valueText(formats);
  const details = tidyDetails({ ...event.details, ...change.details });
  const shown = editableTitle(event, change.pattern, text);
  const follows = change.pattern !== null && shown === change.pattern;
  const template = follows ? (change.newPattern ?? shown) : event.title;
  const title = fillGaps(template.trim(), filledDetails(details, text)).slice(
    0,
    EventLimits.title,
  );
  if (title === event.title && sameDetails(details, tidyDetails(event.details)))
    return null;
  const refills = planRefill(
    tasks.filter((task) => task.eventId === event.id),
    workflows,
    event,
    { ...event, title, details },
    formats,
  ).updates;
  return { eventId: event.id, title, details, refills };
}

/** The same change for many events, leaving out the ones it doesn't change. */
export function planSetEdit(
  events: readonly EventRecord[],
  change: DetailsChange,
  tasks: readonly TaskRecord[],
  workflows: readonly WorkflowRecord[],
  formats: Formats,
): EventEdit[] {
  return events.flatMap((event) => {
    const edit = planEventEdit(event, change, tasks, workflows, formats);
    return edit ? [edit] : [];
  });
}

/**
 * A field's value across the events: the one they all share, or null when
 * they differ.
 */
export function sharedValue(
  events: readonly Pick<EventRecord, "details">[],
  key: string,
): string | null {
  const values = new Set(events.map((event) => event.details[key] ?? ""));
  return values.size === 1 ? [...values][0] : null;
}
