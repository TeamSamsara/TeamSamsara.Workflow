// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useCanManage.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Whether the signed-in member may change or delete an event, a
// repeat or a set (and its tasks): Plan events, they can see it, and whoever
// made it is at or below their rank. The same answer the server and the
// database rules give.

import { decide } from "@engine/access/index";
import { useActor } from "@/core/access";
import { useMembers } from "@/features/members";

export interface ManageableScope {
  everyone: boolean;
  memberIds: readonly string[];
  groupIds: readonly string[];
  createdBy: string;
}

export function useCanManage(
  target: ManageableScope | null | undefined,
): boolean {
  const actor = useActor();
  const members = useMembers();
  if (!actor || !target) return false;
  const ownerRank =
    members.records.find((member) => member.id === target.createdBy)?.rank ?? 0;
  return decide(actor, {
    action: "event.edit",
    event: { ...target, ownerRank },
  }).ok;
}
