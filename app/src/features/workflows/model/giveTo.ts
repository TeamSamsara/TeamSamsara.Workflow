// File : /TeamSamsara.Workflow/app/src/features/workflows/model/giveTo.ts
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : "Give to" as one choice: a work group or a person, written as
// "group:<id>" or "member:<id>" in a select, and back.

import type { WorkflowStep } from "../types/workflowTypes";

type Assignee = Pick<WorkflowStep, "workGroupId" | "memberId">;

/** The select value for who a task is given to; "" for no one. */
export function giveToValue({ workGroupId, memberId }: Assignee): string {
  if (workGroupId) return `group:${workGroupId}`;
  if (memberId) return `member:${memberId}`;
  return "";
}

/** A select value back to a group or a person (never both). */
export function parseGiveTo(value: string): Assignee {
  const [kind, id] = value.split(":");
  if (kind === "group" && id) return { workGroupId: id, memberId: null };
  if (kind === "member" && id) return { workGroupId: null, memberId: id };
  return { workGroupId: null, memberId: null };
}
