// File : /TeamSamsara.Workflow/app/src/features/tasks/hooks/useTaskAbilities.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : What the signed-in member may do with a task, the same way
// firestore.rules decides it: do it, approve it, reassign it, edit it,
// delete it.

import { usePermissions } from "@/core/access";
import { useSession } from "@/core/session";
import { isAssignedTo } from "../model/assignment";
import type { TaskAbilities } from "../model/taskStatusFlow";
import type { TaskRecord } from "../types/taskTypes";

export interface TaskPermissions extends TaskAbilities {
  canEdit: boolean;
  canReassign: boolean;
  canDelete: boolean;
  /** The signed-in member's id, for recording who did what. */
  viewerId: string | null;
}

export function useTaskAbilities(task: TaskRecord): TaskPermissions {
  const access = usePermissions();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const isMaker =
    member !== null && task.createdBy === member.id && task.eventId === null;
  const canEditAny = access.can("editAnyTask");
  return {
    viewerId: member?.id ?? null,
    canWork:
      member !== null &&
      access.can("doAssignedTasks") &&
      isAssignedTo(task, member),
    canApprove: access.can("approveTasks"),
    canEdit: canEditAny || isMaker,
    canReassign: canEditAny || isMaker || access.can("reassignTasks"),
    canDelete: canEditAny || isMaker,
  };
}
