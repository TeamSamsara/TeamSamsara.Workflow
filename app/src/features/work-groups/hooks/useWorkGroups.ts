// File : /TeamSamsara.Workflow/app/src/features/work-groups/hooks/useWorkGroups.ts
// Version : 1.2.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Every work group, by name, each with the members in it. Live:
// changes by anyone show at once. Open-task counts join in with the tasks PR.

import { useMemo } from "react";
import { collection } from "firebase/firestore";
import { usePermissions } from "@/core/access";
import {
  Collections,
  isCurrentMember,
  memberConverter,
  useLiveCollection,
  type DataErrorKind,
  type MemberRecord,
} from "@/core/data";
import {
  workGroupConverter,
  type WorkGroupListItem,
} from "../types/workGroupTypes";

const groupsKey = "workGroups:all";
const membersKey = "workGroups:members";

export interface WorkGroupList {
  status: "loading" | "ready" | "error";
  items: WorkGroupListItem[];
  error: DataErrorKind | null;
}

export function useWorkGroups(): WorkGroupList {
  const access = usePermissions();
  const isReady = access.status === "ready";
  const groups = useLiveCollection(isReady ? groupsKey : null, (database) =>
    collection(database, Collections.workGroups).withConverter(
      workGroupConverter,
    ),
  );
  const members = useLiveCollection(isReady ? membersKey : null, (database) =>
    collection(database, Collections.members).withConverter(memberConverter),
  );

  return useMemo<WorkGroupList>(() => {
    if (groups.status === "error") {
      return { status: "error", items: [], error: groups.error };
    }
    if (groups.status !== "ready") {
      return { status: "loading", items: [], error: null };
    }
    const memberList =
      members.status === "ready"
        ? (members.data ?? []).filter(isCurrentMember)
        : null;
    const items = [...(groups.data ?? [])]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((group) => ({
        group,
        members: memberList
          ? memberList
              .filter((member) => member.workGroupIds.includes(group.id))
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
          : null,
        leads: memberList
          ? group.leadIds
              .map((leadId) =>
                memberList.find((member) => member.id === leadId),
              )
              .filter((member): member is MemberRecord => member !== undefined)
          : null,
      }));
    return { status: "ready", items, error: null };
  }, [groups, members]);
}
