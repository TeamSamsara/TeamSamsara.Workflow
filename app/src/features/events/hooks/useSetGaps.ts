// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useSetGaps.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The fields a set's events are asked for: the ones in its title
// pattern, then the ones its workflows use.

import { useWorkflows } from "@/features/workflows";
import { askedGaps } from "../model/applyWorkflows";
import { planGaps } from "../model/planDraft";
import type { EventSetRecord } from "../types/setTypes";

export function useSetGaps(set: EventSetRecord): string[] {
  const workflows = useWorkflows();
  const used = workflows.items.filter((workflow) =>
    set.workflowIds.includes(workflow.id),
  );
  return planGaps(set.titlePattern, askedGaps(used));
}
