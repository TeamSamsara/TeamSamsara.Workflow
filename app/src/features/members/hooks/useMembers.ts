// File : /TeamSamsara.Workflow/app/src/features/members/hooks/useMembers.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The live member list, each member with their roles and work groups
// joined in. `items` is everyone still in the workspace; `records` also keeps
// removed members, so an invite can bring one back.

import { useMemo } from "react";
import { collection } from "firebase/firestore";
import { usePermissions } from "@/core/access";
import {
  Collections,
  isCurrentMember,
  memberConverter,
  sortRoles,
  useLiveCollection,
  type DataErrorKind,
  type MemberRecord,
} from "@/core/data";
import { useWorkGroups } from "@/features/work-groups";
import type { MemberListItem } from "../types/memberTypes";

const membersKey = "members:all";

export interface MemberList {
  status: "loading" | "ready" | "error";
  items: MemberListItem[];
  records: MemberRecord[];
  error: DataErrorKind | null;
}

export function useMembers(): MemberList {
  const access = usePermissions();
  const groups = useWorkGroups();
  const members = useLiveCollection(
    access.status === "ready" ? membersKey : null,
    (database) =>
      collection(database, Collections.members).withConverter(memberConverter),
  );

  return useMemo<MemberList>(() => {
    if (members.status === "error") {
      return { status: "error", items: [], records: [], error: members.error };
    }
    if (members.status !== "ready" || !access.roles) {
      return { status: "loading", items: [], records: [], error: null };
    }
    const records = members.data ?? [];
    const roles = sortRoles(access.roles.roles);
    const groupList = groups.items.map((entry) => entry.group);
    const items = records.filter(isCurrentMember).map((member) => ({
      member,
      roles: roles.filter((role) => member.roleIds.includes(role.id)),
      groups: groupList.filter((group) =>
        member.workGroupIds.includes(group.id),
      ),
    }));
    return { status: "ready", items, records, error: null };
  }, [members, access.roles, groups.items]);
}
