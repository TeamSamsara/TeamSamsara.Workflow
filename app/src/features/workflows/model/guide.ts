// File : /TeamSamsara.Workflow/app/src/features/workflows/model/guide.ts
// Version : 1.1.0
// Latest commit: fix/general-wording
// Author : Gerrah
// Purpose : The guided way to make a first workflow: suggested tasks (each
// with a sensible due time), and turning the answers into a
// workflow, with its tasks in the order they fall due.

import type { DueOffset, WorkflowFields } from "../types/workflowTypes";
import { DuePresets } from "./duePresets";
import { dueOrder } from "./dueOffset";
import { localId } from "./localId";
import { newStep } from "./workflowDraft";

export interface GuideTask {
  id: string;
  title: string;
  workGroupId: string | null;
  memberId: string | null;
  due: DueOffset;
}

export interface GuideAnswers {
  name: string;
  description: string;
  tasks: GuideTask[];
}

const preset = (id: string): DueOffset =>
  DuePresets.find((entry) => entry.id === id)?.offset ?? DuePresets[0].offset;

/**
 * Common tasks across the org (social, design, sponsorships, co-streamers,
 * meetings), each with when it's usually due.
 */
export const SuggestedTasks: readonly { title: string; due: DueOffset }[] = [
  { title: "Announcement post", due: preset("2d-before") },
  { title: "Graphic", due: preset("1d-before") },
  { title: "Sponsor mention", due: preset("1d-before") },
  { title: "Co-streamer brief", due: preset("1d-before") },
  { title: "Results post", due: preset("1h-after") },
  { title: "Clips for socials", due: preset("1d-after") },
  { title: "Meeting notes", due: preset("1d-after") },
];

/** Tasks typed in by hand start as due the day before. */
export function guideTask(title: string): GuideTask {
  const suggestion = SuggestedTasks.find(
    (entry) => entry.title.toLowerCase() === title.trim().toLowerCase(),
  );
  return {
    id: localId(),
    title: title.trim(),
    workGroupId: null,
    memberId: null,
    due: suggestion?.due ?? preset("1d-before"),
  };
}

/** The workflow the answers make, its tasks ordered by when they're due. */
export function guideToWorkflow(answers: GuideAnswers): WorkflowFields {
  const ordered = answers.tasks
    .map((task, index) => ({ task, index }))
    .sort(
      (a, b) =>
        dueOrder(a.task.due) - dueOrder(b.task.due) || a.index - b.index,
    )
    .map(({ task }) => task);
  return {
    name: answers.name.trim(),
    description: answers.description.trim(),
    eventTypeId: null,
    steps: ordered.map((task) => ({
      ...newStep(),
      id: task.id,
      title: task.title,
      workGroupId: task.workGroupId,
      memberId: task.memberId,
      due: task.due,
    })),
  };
}
