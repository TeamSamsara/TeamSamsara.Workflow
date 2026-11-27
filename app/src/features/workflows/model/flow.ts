// File : /TeamSamsara.Workflow/app/src/features/workflows/model/flow.ts
// Version : 1.0.0
// Latest commit: feature/1.2-flow-view
// Author : Gerrah
// Purpose : A workflow as a flow: one column per due time (earliest first),
// where the event starts among them, each step in its column, and the links
// its order rules make (solid when something has to happen first, dashed
// when it's only the order, out of order when it comes after a step due at
// the same moment or later). Also linking two steps by dragging.

import { describeDue, dueOrder } from "./dueOffset";
import { locks, orderLinks, wouldLoop } from "./orderRules";
import { newOrderRule } from "./workflowDraft";
import type { ClockFormat } from "@/shared/time/dates";
import type { WorkflowStep } from "../types/workflowTypes";

export interface StepFlow {
  columns: string[];
  /** The event starts before this column; null when every step is before it. */
  startsBefore: number | null;
  /** Each step's column, by id. */
  columnOf: Record<string, number>;
  links: {
    id: string;
    from: string;
    to: string;
    kind: "hard" | "soft";
    bad: boolean;
    /** The step and rule it was written on. */
    ownerId: string;
    ruleId: string;
  }[];
}

/** Steps in due order, laid out as a flow. */
export function stepFlow(
  steps: readonly WorkflowStep[],
  clockFormat: ClockFormat,
): StepFlow {
  const orders = [...new Set(steps.map((step) => dueOrder(step.due)))].sort(
    (a, b) => a - b,
  );
  const columns = orders.map((order) => {
    const step = steps.find((entry) => dueOrder(entry.due) === order);
    return step ? describeDue(step.due, clockFormat) : "";
  });
  const columnOf = Object.fromEntries(
    steps.map((step) => [step.id, orders.indexOf(dueOrder(step.due))]),
  );
  // The first column at or after the start (a step due "after" or "at").
  const startIndex = orders.findIndex(
    (order) =>
      steps.find((entry) => dueOrder(entry.due) === order)?.due.direction !==
      "before",
  );
  const due = (id: string) =>
    dueOrder(steps.find((step) => step.id === id)?.due ?? steps[0].due);
  return {
    columns,
    startsBefore: startIndex === -1 ? null : startIndex,
    columnOf,
    links: orderLinks(steps).map((link) => ({
      id: `${link.ownerId}:${link.ruleId}`,
      from: link.from,
      to: link.to,
      kind: locks(link.condition) ? "hard" : "soft",
      bad: due(link.from) >= due(link.to),
      ownerId: link.ownerId,
      ruleId: link.ruleId,
    })),
  };
}

/**
 * Links two steps by dragging one onto another: the second comes after the
 * first once it's done. Gives back the new steps, or null when they're
 * already linked or it would make a loop.
 */
export function linkSteps(
  steps: readonly WorkflowStep[],
  from: string,
  to: string,
): WorkflowStep[] | null {
  if (from === to) return null;
  const linked = orderLinks(steps).some(
    (link) =>
      (link.from === from && link.to === to) ||
      (link.from === to && link.to === from),
  );
  if (linked || wouldLoop(steps, to, from, "after")) return null;
  return steps.map((step) =>
    step.id === to
      ? {
          ...step,
          order: [
            ...step.order,
            {
              ...newOrderRule(),
              relation: "after",
              stepId: from,
              condition: "done",
            },
          ],
        }
      : step,
  );
}
