// File : /TeamSamsara.Workflow/app/src/features/workflows/model/workflowChecks.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : What must be fixed before a workflow can be saved: a name, a title
// for every task, and complete reference links. Post text over a platform's
// limit is only flagged, since the gaps change its length.

import { checkLink } from "@/features/work-groups";
import { checkName } from "@/shared/validation/nameRules";
import {
  WorkflowLimits,
  type WorkflowFields,
  type WorkflowStep,
} from "../types/workflowTypes";
import { WorkflowCheckText as Text } from "./workflowChecksContent";

export interface StepProblems {
  title?: string;
  notes?: string;
  /** One entry per link, undefined when that link is fine. */
  links: (string | undefined)[];
}

export interface WorkflowProblems {
  name?: string;
  description?: string;
  steps: Record<string, StepProblems>;
  /** How many things need fixing. */
  count: number;
}

function checkStep(step: WorkflowStep): StepProblems | null {
  const title = step.title.trim();
  const titleProblem = !title
    ? Text.titleRequired
    : title.length > WorkflowLimits.title
      ? Text.tooLong(WorkflowLimits.title)
      : undefined;
  const notesProblem =
    step.notes.length > WorkflowLimits.notes
      ? Text.tooLong(WorkflowLimits.notes)
      : undefined;
  const links = (step.links ?? []).map(checkLink);
  if (!titleProblem && !notesProblem && links.every((problem) => !problem)) {
    return null;
  }
  return { title: titleProblem, notes: notesProblem, links };
}

export function checkWorkflow(fields: WorkflowFields): WorkflowProblems {
  const name = checkName(fields.name);
  const description =
    fields.description.trim().length > WorkflowLimits.description
      ? Text.tooLong(WorkflowLimits.description)
      : undefined;
  const steps: Record<string, StepProblems> = {};
  let count = (name ? 1 : 0) + (description ? 1 : 0);
  for (const step of fields.steps) {
    const problems = checkStep(step);
    if (!problems) continue;
    steps[step.id] = problems;
    count +=
      (problems.title ? 1 : 0) +
      (problems.notes ? 1 : 0) +
      problems.links.filter(Boolean).length;
  }
  return { name, description, steps, count };
}
