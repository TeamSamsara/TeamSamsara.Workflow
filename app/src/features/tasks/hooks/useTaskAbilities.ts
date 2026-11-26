// File : /TeamSamsara.Workflow/app/src/features/tasks/hooks/useTaskAbilities.ts
// Version : 2.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : What the signed-in member may do with a task, asked of the shared
// permission model (the same answers the server and database rules give): do
// it, approve it (never their own work, the doer at or below them), reassign
// it, edit it, delete it, with the reason when they can't.

import {
  decide,
  type DenyReason,
  type EventScope,
  type TaskScope,
} from "@engine/access/index";
import { useMemo } from "react";
import { useActor } from "@/core/access";
import { useMembers } from "@/features/members";
import type { TaskAbilities } from "../model/taskStatusFlow";
import type { TaskRecord } from "../types/taskTypes";

export interface TaskPermissions extends TaskAbilities {
  canEdit: boolean;
  canReassign: boolean;
  canDelete: boolean;
  /** Why approving isn't offered, when it would otherwise be. */
  approveBlockedBy: DenyReason | null;
  /** The signed-in member's id, for recording who did what. */
  viewerId: string | null;
}

/** What the task page knows about the task's event, for a planner's rights. */
export interface TaskEventForAbilities {
  everyone: boolean;
  memberIds: readonly string[];
  groupIds: readonly string[];
  createdBy: string;
}

export function useTaskAbilities(
  task: TaskRecord,
  context: { event: TaskEventForAbilities | null; awaitingReview: boolean },
): TaskPermissions {
  const actor = useActor();
  const members = useMembers();
  return useMemo(() => {
    const rankOf = (id: string | null) =>
      id
        ? (members.records.find((member) => member.id === id)?.rank ?? 0)
        : null;
    const event: EventScope | null =
      task.eventId && context.event
        ? { ...context.event, ownerRank: rankOf(context.event.createdBy) ?? 0 }
        : null;
    const doer = task.sentForReviewBy ?? task.memberId;
    const scope: TaskScope = {
      groupId: task.workGroupId,
      memberId: task.memberId,
      createdBy: task.createdBy,
      event,
      sentForReviewBy: task.sentForReviewBy,
      awaitingReview: context.awaitingReview,
      ranks: {
        assignee: rankOf(task.memberId),
        doer: rankOf(doer),
        maker: rankOf(task.createdBy) ?? 0,
      },
    };
    if (!actor)
      return {
        viewerId: null,
        canWork: false,
        canApprove: false,
        canEdit: false,
        canReassign: false,
        canDelete: false,
        approveBlockedBy: null,
      };
    const approve = decide(actor, { action: "task.approve", task: scope });
    return {
      viewerId: actor.id,
      canWork: decide(actor, { action: "task.do", task: scope }).ok,
      canApprove: approve.ok,
      approveBlockedBy:
        !approve.ok && approve.reason !== "missingPermission"
          ? approve.reason
          : null,
      canEdit: decide(actor, { action: "task.editContent", task: scope }).ok,
      // Who it goes to is checked again when they pick someone.
      canReassign: decide(actor, {
        action: "task.reassign",
        task: scope,
        to: {
          memberId: null,
          groupId: task.workGroupId,
          rank: null,
          eligible: true,
        },
      }).ok,
      canDelete: decide(actor, { action: "task.delete", task: scope }).ok,
    };
  }, [actor, members.records, task, context.event, context.awaitingReview]);
}
