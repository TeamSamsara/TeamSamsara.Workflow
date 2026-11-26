// File : /TeamSamsara.Workflow/app/src/core/access/useActor.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The signed-in member as the shared permission model sees them
// (permissions, rank, groups and the groups they lead), for asking decide()
// whether a button should show. The server and the database rules answer
// the same way, so what the screen offers is what will be allowed.

import { actorOf, type Actor } from "@engine/access/index";
import { useMemo } from "react";
import { useSession } from "@/core/session";
import { usePermissions } from "./usePermissions";

export function useActor(): Actor | null {
  const access = usePermissions();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const roles = access.roles?.roles ?? null;
  return useMemo(
    () =>
      member && roles && access.status === "ready"
        ? actorOf(
            {
              id: member.id,
              status: member.status,
              roleIds: member.roleIds,
              workGroupIds: member.workGroupIds,
            },
            roles,
            member.leadOf,
          )
        : null,
    [member, roles, access.status],
  );
}
