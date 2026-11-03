// File : /TeamSamsara.Workflow/app/src/features/workflows/model/workflowDraft.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : The changes the editor makes to a workflow's steps: add, change,
// duplicate, move and remove a step. Each returns a new list.

import {
  WorkflowLimits,
  type DueOffset,
  type WorkflowFields,
  type WorkflowStep,
} from "../types/workflowTypes";
import { localId } from "./localId";

/** New tasks are due a day before by default, the most common case. */
const defaultDue: DueOffset = {
  direction: "before",
  days: 1,
  hours: 0,
  minutes: 0,
  time: null,
};

export function newStep(): WorkflowStep {
  return {
    id: localId(),
    title: "",
    notes: "",
    workGroupId: null,
    memberId: null,
    due: defaultDue,
    needsApproval: false,
    tagIds: [],
    posts: null,
    checklist: null,
    links: null,
    asksForLiveLink: false,
  };
}

export const emptyWorkflow: WorkflowFields = {
  name: "",
  description: "",
  eventTypeId: null,
  steps: [],
};

export function canAddStep(steps: readonly WorkflowStep[]): boolean {
  return steps.length < WorkflowLimits.steps;
}

export function addStep(
  steps: readonly WorkflowStep[],
  step: WorkflowStep = newStep(),
): WorkflowStep[] {
  return canAddStep(steps) ? [...steps, step] : [...steps];
}

export function changeStep(
  steps: readonly WorkflowStep[],
  id: string,
  changes: Partial<Omit<WorkflowStep, "id">>,
): WorkflowStep[] {
  return steps.map((step) => (step.id === id ? { ...step, ...changes } : step));
}

/** A copy placed right after the original, with new ids throughout. */
export function duplicateStep(
  steps: readonly WorkflowStep[],
  id: string,
): { steps: WorkflowStep[]; copyId: string | null } {
  const index = steps.findIndex((step) => step.id === id);
  if (index < 0 || !canAddStep(steps))
    return { steps: [...steps], copyId: null };
  const original = steps[index];
  const copy: WorkflowStep = {
    ...structuredClone(original),
    id: localId(),
    checklist:
      original.checklist?.map((item) => ({ ...item, id: localId() })) ?? null,
  };
  return {
    steps: [...steps.slice(0, index + 1), copy, ...steps.slice(index + 1)],
    copyId: copy.id,
  };
}

export function removeStep(
  steps: readonly WorkflowStep[],
  id: string,
): WorkflowStep[] {
  return steps.filter((step) => step.id !== id);
}

/** Puts the steps in the given order; ids it doesn't know are ignored. */
export function orderSteps(
  steps: readonly WorkflowStep[],
  orderedIds: readonly string[],
): WorkflowStep[] {
  const byId = new Map(steps.map((step) => [step.id, step]));
  const ordered = orderedIds.flatMap((id) => {
    const step = byId.get(id);
    return step ? [step] : [];
  });
  const missing = steps.filter((step) => !orderedIds.includes(step.id));
  return [...ordered, ...missing];
}

/** Trims what people typed, ready to save. */
export function tidyWorkflow(fields: WorkflowFields): WorkflowFields {
  return {
    name: fields.name.trim(),
    description: fields.description.trim(),
    eventTypeId: fields.eventTypeId,
    steps: fields.steps.map((step) => ({
      ...step,
      title: step.title.trim(),
      notes: step.notes.trim(),
      checklist:
        step.checklist
          ?.map((item) => ({ ...item, text: item.text.trim() }))
          .filter((item) => item.text.length > 0) ?? null,
      links:
        step.links?.map((link) => ({
          label: link.label.trim(),
          url: link.url.trim(),
        })) ?? null,
    })),
  };
}

/** Whether two versions of a workflow are the same, for "unsaved changes". */
export function sameWorkflow(a: WorkflowFields, b: WorkflowFields): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
