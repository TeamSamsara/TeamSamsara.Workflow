// File : /TeamSamsara.Workflow/app/src/features/workflows/model/guide.ts
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The guided way to make a first workflow: suggested names and
// tasks (each with a sensible due time), and turning the answers into a
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

export const SuggestedNames = [
  "Livestream",
  "Video release",
  "Collab stream",
  "Announcement",
] as const;

/** Common tasks with when they're usually due. */
export const SuggestedTasks: readonly { title: string; due: DueOffset }[] = [
  { title: "Announcement post", due: preset("2d-before") },
  { title: "Thumbnail", due: preset("1d-before") },
  { title: "Stream title", due: preset("1h-before") },
  { title: "Go-live post", due: preset("start") },
  { title: "Save the VOD", due: preset("1h-after") },
  { title: "Recap post", due: preset("1d-after") },
  { title: "Clips for socials", due: preset("1d-after") },
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
