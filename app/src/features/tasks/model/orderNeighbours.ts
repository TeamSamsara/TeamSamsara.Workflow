// File : /TeamSamsara.Workflow/app/src/features/tasks/model/orderNeighbours.ts
// Version : 1.0.0
// Latest commit: feature/1.2-tasks-follow-order
// Author : Gerrah
// Purpose : The tasks a task comes after and the ones that come after it, from
// its workflow's steps, named and linked by the event's tasks the viewer can
// open (by what it still waits on, or by the step's title, otherwise).

import { fillText } from "@engine/tasks";
import { waitsOf, type OrderRule } from "@engine/order";
import type { OrderNeighbour } from "../ui/OrderCard";
import type { TaskRecord } from "../types/taskTypes";

export interface StepForNeighbours {
  id: string;
  title: string;
  order: readonly OrderRule[];
}

export function orderNeighbours(
  task: TaskRecord,
  siblings: readonly TaskRecord[],
  steps: readonly StepForNeighbours[],
): { before: OrderNeighbour[]; after: OrderNeighbour[] } {
  if (!task.workflowId || !task.stepId) return { before: [], after: [] };
  const neighbour = (
    stepId: string,
    condition: OrderNeighbour["condition"],
  ): OrderNeighbour => {
    const other = siblings.find(
      (entry) =>
        entry.workflowId === task.workflowId && entry.stepId === stepId,
    );
    const waiting = task.waitingOn.find((wait) => wait.stepId === stepId);
    const step = steps.find((entry) => entry.id === stepId);
    return {
      stepId,
      title: other?.title ?? waiting?.title ?? fillText(step?.title ?? "", {}),
      taskId: other?.id ?? null,
      done: other ? other.doneAt !== null : false,
      condition,
    };
  };
  const before = task.waitsOn.map((wait) =>
    neighbour(wait.stepId, wait.condition),
  );
  const after = steps.flatMap((step) => {
    const wait = waitsOf(steps, step.id).find(
      (entry) => entry.stepId === task.stepId,
    );
    return wait && step.id !== task.stepId
      ? [neighbour(step.id, wait.condition)]
      : [];
  });
  return { before, after };
}
