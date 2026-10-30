// File : /TeamSamsara.Workflow/app/src/features/tasks/model/assignment.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Whether a task is the viewer's: given to them, or to a work group
// they're in. The security rules check the same.

import type { MemberRecord } from "@/core/data";
import type { TaskRecord } from "../types/taskTypes";

type Assigned = Pick<TaskRecord, "memberId" | "workGroupId">;
type Viewer = Pick<MemberRecord, "id" | "workGroupIds">;

export function isGivenToMe(task: Assigned, viewer: Viewer): boolean {
  return task.memberId === viewer.id;
}

export function isGivenToMyGroup(task: Assigned, viewer: Viewer): boolean {
  return (
    task.workGroupId !== null && viewer.workGroupIds.includes(task.workGroupId)
  );
}

/** Given to them or to one of their groups. */
export function isAssignedTo(task: Assigned, viewer: Viewer): boolean {
  return isGivenToMe(task, viewer) || isGivenToMyGroup(task, viewer);
}
