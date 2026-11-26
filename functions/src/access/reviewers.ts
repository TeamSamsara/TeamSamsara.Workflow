// File : /TeamSamsara.Workflow/functions/src/access/reviewers.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Who is asked to approve a task sent for review, in order: the
// leads of its group who can approve it; if none, everyone with Approve tasks
// who can; if still none, the Administrators. "Can approve" is the shared
// decide(): never the person who did it, and only people at or above them.

import {
  actorOf,
  decide,
  type MemberStatus,
  type RoleForAccess,
  type TaskScope,
} from "../../../engine/src/index.js";

export interface ReviewerCandidate {
  id: string;
  status: MemberStatus;
  roleIds: readonly string[];
  workGroupIds: readonly string[];
  leadOf: readonly string[];
  rank: number;
}

export interface TaskForReview {
  memberId: string | null;
  workGroupId: string | null;
  sentForReviewBy: string | null;
  createdBy?: string | null;
}

export function reviewersFor(
  task: TaskForReview,
  people: readonly ReviewerCandidate[],
  roles: readonly RoleForAccess[],
): string[] {
  const rankOf = (id: string | null | undefined) =>
    id ? (people.find((person) => person.id === id)?.rank ?? 0) : null;
  const doer = task.sentForReviewBy ?? task.memberId;
  const scope: TaskScope = {
    groupId: task.workGroupId,
    memberId: task.memberId,
    createdBy: task.createdBy ?? "",
    event: null,
    sentForReviewBy: task.sentForReviewBy,
    awaitingReview: true,
    ranks: {
      assignee: rankOf(task.memberId),
      doer: rankOf(doer),
      maker: rankOf(task.createdBy) ?? 0,
    },
  };
  const able = people
    .filter((person) => person.status === "active")
    .map((person) => ({
      person,
      actor: actorOf(person, roles, person.leadOf),
    }))
    .filter(
      ({ actor }) => decide(actor, { action: "task.approve", task: scope }).ok,
    );

  const leads = able.filter(({ person }) =>
    task.workGroupId ? person.leadOf.includes(task.workGroupId) : false,
  );
  if (leads.length) return leads.map(({ person }) => person.id);
  const approvers = able.filter(({ actor }) =>
    actor.permissions.has("approveTasks"),
  );
  if (approvers.length) return approvers.map(({ person }) => person.id);
  // Nobody outranks the doer but the Administrators: ask them, never the doer.
  return people
    .filter(
      (person) =>
        person.status === "active" &&
        person.id !== doer &&
        actorOf(person, roles, person.leadOf).permissions.has("administrator"),
    )
    .map((person) => person.id);
}
