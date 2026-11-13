// File : /TeamSamsara.Workflow/functions/src/access/workflowNames.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : A workflow names only people at or below whoever saves it. The
// database can't check the rank of everyone a list of steps names, so the
// server checks each save: a step that newly names someone above the person
// who saved it is put back to its group (or no one), and the change is
// recorded in the activity history. Names already there stay as they were.

import type { DocumentData } from "firebase-admin/firestore";

export interface StepName {
  stepId: string;
  title: string;
  memberId: string;
}

/** The people the save newly names who are above the person who saved it. */
export function namesAboveSaver(
  before: readonly DocumentData[],
  after: readonly DocumentData[],
  saverRank: number,
  rankOf: (memberId: string) => number,
): StepName[] {
  const was = new Map(
    before.map((step) => [String(step?.id ?? ""), step?.memberId ?? null]),
  );
  return after.flatMap((step) => {
    const memberId = typeof step?.memberId === "string" ? step.memberId : null;
    const stepId = String(step?.id ?? "");
    if (!memberId || was.get(stepId) === memberId) return [];
    return rankOf(memberId) > saverRank
      ? [{ stepId, title: String(step?.title ?? ""), memberId }]
      : [];
  });
}

/** The steps with those names taken off. */
export function withoutNames(
  steps: readonly DocumentData[],
  names: readonly StepName[],
): DocumentData[] {
  const ids = new Set(names.map((name) => name.stepId));
  return steps.map((step) =>
    ids.has(String(step?.id ?? "")) ? { ...step, memberId: null } : step,
  );
}
