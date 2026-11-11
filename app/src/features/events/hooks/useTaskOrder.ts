// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useTaskOrder.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The order to show tasks in: their workflow's step order first,
// their due time second. Takes each event's workflows (in the order the event
// lists them) when they're known.

import { useMemo } from "react";
import { flowRank, sortByFlow, type FlowTask } from "@/features/tasks";
import { useWorkflows } from "@/features/workflows";

const noEvents = () => undefined;

export function useTaskOrder(
  eventWorkflowIds: (
    eventId: string,
  ) => readonly string[] | undefined = noEvents,
): <TTask extends FlowTask>(tasks: readonly TTask[]) => TTask[] {
  const workflows = useWorkflows();
  const rank = useMemo(
    () => flowRank(workflows.items, eventWorkflowIds),
    [workflows.items, eventWorkflowIds],
  );
  return useMemo(
    () =>
      <TTask extends FlowTask>(tasks: readonly TTask[]) =>
        sortByFlow(tasks, rank),
    [rank],
  );
}
