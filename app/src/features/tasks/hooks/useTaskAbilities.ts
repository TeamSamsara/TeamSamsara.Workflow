// File : /TeamSamsara.Workflow/app/src/features/tasks/hooks/useTaskAbilities.ts
// Version : 2.1.0
// Latest commit: feature/1.2-tasks-follow-order
// Author : Gerrah
// Purpose : What the signed-in member may do with a task, asked of the shared
// permission model (the same answers the server and database rules give): do
// it, approve it (never their own work, the doer at or below them), reassign
// it, edit it, delete it, with the reason when they can't. A task locked by
// its order can't be worked on until it unlocks, unless whoever has it (or a
// lead of its group) starts it anyway.

import {
  decide,
  type DenyReason,
  type EventScope,
  type TaskScope,
} from "@engine/access/index";
import { lockState } from "@engine/order";
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
  /** Waiting on other tasks (see waitingOn), so it can't be worked on yet. */
  locked: boolean;
  /** Unlocked because it's late and set to unlock at its due time. */
  unlockedLate: boolean;
  /** May start it anyway, saying why: whoever has it, or a lead. */
  canStartAnyway: boolean;
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
    const lock = lockState(task, new Date());
    if (!actor)
      return {
        viewerId: null,
        locked: lock.locked,
        unlockedLate: lock.unlockedLate,
        canStartAnyway: false,
        canWork: false,
        canApprove: false,
        canEdit: false,
        canReassign: false,
        canDelete: false,
        approveBlockedBy: null,
      };
    const approve = decide(actor, { action: "task.approve", task: scope });
    const canDo = decide(actor, { action: "task.do", task: scope }).ok;
    const leads = task.workGroupId
      ? actor.leadOf.includes(task.workGroupId)
      : false;
    return {
      viewerId: actor.id,
      locked: lock.locked,
      unlockedLate: lock.unlockedLate,
      canStartAnyway:
        lock.locked && ((canDo && task.memberId === actor.id) || leads),
      canWork: canDo && !lock.locked,
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
