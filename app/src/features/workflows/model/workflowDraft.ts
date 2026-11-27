// File : /TeamSamsara.Workflow/app/src/features/workflows/model/workflowDraft.ts
// Version : 1.1.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : The changes the editor makes to a workflow's steps: add, change,
// duplicate, move and remove a step, and its order rules. Each returns a new
// list, and no rule is left pointing at a step that's gone.

import { byDue } from "./orderRules";
import {
  WorkflowLimits,
  type DueOffset,
  type OrderRule,
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
    order: [],
    waitFor: "all",
    whenLate: "wait",
    priority: "normal",
  };
}

/** A new order rule: comes after a step not picked yet, done first. */
export function newOrderRule(): OrderRule {
  return { id: localId(), relation: "after", stepId: "", condition: "done" };
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
    order: original.order.map((rule) => ({ ...rule, id: localId() })),
  };
  return {
    steps: [...steps.slice(0, index + 1), copy, ...steps.slice(index + 1)],
    copyId: copy.id,
  };
}

/** Takes the step out, and every rule of another step that points at it. */
export function removeStep(
  steps: readonly WorkflowStep[],
  id: string,
): WorkflowStep[] {
  return steps
    .filter((step) => step.id !== id)
    .map((step) =>
      step.order.some((rule) => rule.stepId === id)
        ? { ...step, order: step.order.filter((rule) => rule.stepId !== id) }
        : step,
    );
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

/** Trims what people typed, ready to save, with the steps in due order. */
export function tidyWorkflow(fields: WorkflowFields): WorkflowFields {
  return {
    name: fields.name.trim(),
    description: fields.description.trim(),
    eventTypeId: fields.eventTypeId,
    steps: byDue(fields.steps).map((step) => ({
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
      // A rule with no step picked is dropped, and so is a second rule on
      // the same step.
      order: step.order.filter(
        (rule, index, all) =>
          rule.stepId !== "" &&
          rule.stepId !== step.id &&
          all.findIndex((other) => other.stepId === rule.stepId) === index,
      ),
    })),
  };
}

/** Whether two versions of a workflow are the same, for "unsaved changes". */
export function sameWorkflow(a: WorkflowFields, b: WorkflowFields): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
