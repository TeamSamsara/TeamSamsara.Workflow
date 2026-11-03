// File : /TeamSamsara.Workflow/app/src/features/roles/hooks/useRoleList.ts
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : The roles in order (top first, Everyone last), each with how many
// members hold it and whether the signed-in member may manage it, plus where
// their own reach starts in the list. Live: changes by anyone show at once.

import { useMemo } from "react";
import { collection } from "firebase/firestore";
import { canManageRole, usePermissions } from "@/core/access";
import {
  Collections,
  EveryoneRoleId,
  isCurrentMember,
  memberConverter,
  useLiveCollection,
  type RolesRecord,
} from "@/core/data";
import { firstMovableIndex, type RoleEditor } from "../service/roleAccess";
import type { RoleListItem } from "../types/roleTypes";

const membersKey = "roles:members";

export interface RoleList {
  status: "loading" | "ready";
  roles: RolesRecord | null;
  /** Every role, top first, Everyone last. */
  items: RoleListItem[];
  editor: RoleEditor;
  /** In the list without Everyone: rows before this can't be dragged. */
  firstMovableIndex: number;
}

export function useRoleList(): RoleList {
  const access = usePermissions();
  const members = useLiveCollection(
    access.status === "ready" ? membersKey : null,
    (database) =>
      collection(database, Collections.members).withConverter(memberConverter),
  );

  return useMemo<RoleList>(() => {
    const editor: RoleEditor = {
      memberRoleIds: access.memberRoleIds,
      permissions: access.permissions,
    };
    const roles = access.roles;
    if (!roles) {
      return {
        status: "loading",
        roles: null,
        items: [],
        editor,
        firstMovableIndex: 0,
      };
    }

    const memberList =
      members.status === "ready"
        ? (members.data ?? []).filter(isCurrentMember)
        : null;
    const items = roles.roles.map((role) => {
      const isEveryone = role.id === EveryoneRoleId;
      const memberCount = memberList
        ? isEveryone
          ? memberList.length
          : memberList.filter((member) => member.roleIds.includes(role.id))
              .length
        : null;
      return {
        role,
        isEveryone,
        memberCount,
        canManage: canManageRole(access.memberRoleIds, role, roles),
      };
    });
    const ordered = roles.roles.filter((role) => role.id !== EveryoneRoleId);

    return {
      status: "ready",
      roles,
      items,
      editor,
      firstMovableIndex: firstMovableIndex(ordered, roles, editor),
    };
  }, [access, members]);
}
