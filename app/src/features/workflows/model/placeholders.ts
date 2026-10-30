// File : /TeamSamsara.Workflow/app/src/features/workflows/model/placeholders.ts
// Version : 1.1.0
// Latest commit: fix/general-wording
// Author : Gerrah
// Purpose : Gaps in a workflow's text, like {title} or {opponent}, filled from the
// event's details when its tasks are made. {title}, {date}, {time} and {link}
// come from the event itself; any other gap is asked for when planning it.

import type { WorkflowStep } from "../types/workflowTypes";

/** Gaps every event fills on its own. */
export const EventGaps = ["title", "date", "time", "link"] as const;
export type EventGap = (typeof EventGaps)[number];

const gapPattern = /\{([A-Za-z][A-Za-z0-9_-]{0,29})\}/g;

/** The gaps in a text, lower-cased, each once, in the order they appear. */
export function findGaps(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(gapPattern)) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}

/** Fills the gaps it has values for; leaves any others as they are. */
export function fillGaps(
  text: string,
  values: Readonly<Record<string, string>>,
): string {
  return text.replace(gapPattern, (whole, name: string) => {
    const value = values[name.toLowerCase()];
    return value === undefined ? whole : value;
  });
}

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
