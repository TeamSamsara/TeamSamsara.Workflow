// File : /TeamSamsara.Workflow/app/src/features/workflows/model/placeholders.ts
// Version : 1.3.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Fields written in a workflow's text, like {title} or {opponent},
// filled from the event when its tasks are made. The built-in ones ({title},
// {date}, {time}, {end_time}, {link}, {event_type}) come from the event
// itself; any other is asked for when planning it.

import { BuiltInFieldKeys, type BuiltInFieldKey } from "@/features/fields";
import { findGaps } from "@engine/gaps";
import type { WorkflowStep } from "../types/workflowTypes";

// Finding and filling gaps live in the engine, which the server shares.
export { fillGaps, findGaps } from "@engine/gaps";

/** Fields every event fills on its own. */
export const EventGaps = BuiltInFieldKeys;
export type EventGap = BuiltInFieldKey;

/** Every text in a step that may hold gaps. */
function stepTexts(step: WorkflowStep): string[] {
  return [
    step.title,
    step.notes,
    ...(step.checklist ?? []).map((item) => item.text),
    ...(step.posts ?? []).flatMap((post) => Object.values(post.texts)),
  ];
}

export interface WorkflowGaps {
  /** Filled by the event itself. */
  fromEvent: EventGap[];
  /** Asked for when the event is planned, e.g. "opponent". */
  asked: string[];
}

/** The gaps a workflow uses, split by where their values come from. */
export function workflowGaps(steps: readonly WorkflowStep[]): WorkflowGaps {
  const all = new Set(steps.flatMap(stepTexts).flatMap(findGaps));
  const isEventGap = (gap: string): gap is EventGap =>
    (EventGaps as readonly string[]).includes(gap);
  return {
    fromEvent: EventGaps.filter((gap) => all.has(gap)),
    asked: [...all].filter((gap) => !isEventGap(gap)).sort(),
  };
}
