// File : /TeamSamsara.Workflow/app/src/features/events/model/applyWorkflows.ts
// Version : 1.2.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : An event and its workflows → the tasks to make: each step with
// its exact due time (counted from the event's start in the workspace's time
// zone) and its {fields} filled from the event, each the way its type reads
// (a person by name, a date in the workspace's format). A field with no value
// yet shows as its name in brackets, "[Match link]", easy to spot and filled
// in when the event gets it (see refillTasks). The work itself is done by the
// engine (engine/src/tasks.ts), which the server functions share.

import {
  applyWorkflows as makeTasks,
  fillText,
  gapValues,
  valueText,
  type EventForTasks,
} from "@engine/tasks";
import {
  BuiltInFieldKeys,
  nameFromKey,
  type FieldRecord,
} from "@/features/fields";
import type { TaskFields } from "@/features/tasks";
import { findGaps, type WorkflowRecord } from "@/features/workflows";
import type { ClockFormat, DateFormat } from "@/shared/time/dates";

// Making tasks from steps lives in the engine, so the server functions update
// tasks exactly the way the app makes them.
export { fillText, gapValues, valueText };
export type { EventForTasks, ValueText } from "@engine/tasks";

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

/** Every task the workflows make for this event, earliest due first. */
export function applyWorkflows(
  event: EventForTasks,
  workflows: readonly WorkflowRecord[],
  formats: Formats,
): PlannedTask[] {
  return makeTasks(event, workflows, formats);
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
