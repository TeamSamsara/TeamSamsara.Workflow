// File : /TeamSamsara.Workflow/app/src/features/tasks/model/editedParts.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Which parts of a task someone changed by hand, so the background
// sync that keeps tasks in line with their workflow leaves those parts alone.
// Ticking checklist items or moving a task on doesn't count; changing its
// due time, who it's given to, its text, checklist items or post text does.

import type { TaskPart } from "@engine/sync";
import type { TaskFields, TaskRecord } from "../types/taskTypes";

const sameItems = (a: TaskRecord["checklist"], b: TaskRecord["checklist"]) =>
  (a ?? []).length === (b ?? []).length &&
  (a ?? []).every(
    (item, index) => item.id === b?.[index].id && item.text === b[index].text,
  );

const samePosts = (a: TaskRecord["posts"], b: TaskRecord["posts"]) =>
  JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

/** The parts changed by hand once these fields are saved, earlier ones kept. */
export function editedPartsAfter(
  task: Pick<
    TaskRecord,
    | "editedParts"
    | "dueAt"
    | "workGroupId"
    | "memberId"
    | "title"
    | "notes"
    | "checklist"
    | "posts"
  >,
  fields: Partial<TaskFields>,
): string[] {
  const parts = new Set<string>(task.editedParts ?? []);
  const add = (part: TaskPart, changed: boolean) => {
    if (changed) parts.add(part);
  };
  if (fields.dueAt !== undefined)
    add(
      "due",
      (fields.dueAt?.getTime() ?? null) !== (task.dueAt?.getTime() ?? null),
    );
  if (fields.workGroupId !== undefined || fields.memberId !== undefined)
    add(
      "assignee",
      (fields.workGroupId ?? null) !== task.workGroupId ||
        (fields.memberId ?? null) !== task.memberId,
    );
  if (fields.title !== undefined)
    add("title", fields.title.trim() !== task.title);
  if (fields.notes !== undefined)
    add("notes", fields.notes.trim() !== task.notes);
  if (fields.checklist !== undefined)
    add("checklist", !sameItems(fields.checklist, task.checklist));
  if (fields.posts !== undefined)
    add("posts", !samePosts(fields.posts, task.posts));
  return [...parts].sort();
}
