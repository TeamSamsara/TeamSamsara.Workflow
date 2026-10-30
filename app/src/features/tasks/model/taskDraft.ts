// File : /TeamSamsara.Workflow/app/src/features/tasks/model/taskDraft.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : A task's fields as the form holds them (the due time as a date box
// and a time box) and back, in the workspace's time zone.

import type { TaskFields, TaskRecord } from "../types/taskTypes";
import { TaskFormText } from "../ui/tasksContent";
import { fromDateAndTime, toDateAndTime } from "./formatDue";

/** The form's values: the task's fields with the due time as two boxes. */
export type TaskDraft = Omit<TaskFields, "dueAt"> & {
  dueDate: string;
  dueTime: string;
};

/** What's wrong with the form, if anything. */
export function checkTaskDraft(draft: TaskDraft): string | undefined {
  return draft.title.trim() ? undefined : TaskFormText.titleRequired;
}

export const emptyTaskDraft: TaskDraft = {
  title: "",
  notes: "",
  workGroupId: null,
  memberId: null,
  dueDate: "",
  dueTime: "",
  needsApproval: false,
  tagIds: [],
  posts: null,
  checklist: null,
  links: null,
  asksForLiveLink: false,
};

export function draftFromTask(task: TaskRecord, timeZone: string): TaskDraft {
  const { date, time } = toDateAndTime(task.dueAt, timeZone);
  return {
    title: task.title,
    notes: task.notes,
    workGroupId: task.workGroupId,
    memberId: task.memberId,
    dueDate: date,
    dueTime: time,
    needsApproval: task.needsApproval,
    tagIds: task.tagIds,
    posts: task.posts,
    checklist: task.checklist,
    links: task.links,
    asksForLiveLink: task.asksForLiveLink,
  };
}

export function fieldsFromDraft(
  draft: TaskDraft,
  timeZone: string,
): TaskFields {
  const { dueDate, dueTime, ...fields } = draft;
  return { ...fields, dueAt: fromDateAndTime(dueDate, dueTime, timeZone) };
}
