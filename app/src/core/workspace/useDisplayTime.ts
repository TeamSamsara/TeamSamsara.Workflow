// File : /TeamSamsara.Workflow/app/src/core/workspace/useDisplayTime.ts
// Version : 1.0.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : How times and dates are shown to the person signed in: their own
// time zone, date format and clock when they picked them on Your account, else
// the workspace's. Things are still planned in the workspace's time zone; this
// is only for showing them.

import type { DateFormat, TimeFormat } from "@/core/data";
import { useSession } from "@/core/session";
import { useWorkspaceRecord } from "./useWorkspace";

export interface DisplayTime {
  timeZone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  /** The workspace's time zone, which things are planned in. */
  workspaceTimeZone: string;
  /** True when the person sees times in a zone other than the workspace's. */
  isOwnZone: boolean;
}

export function useDisplayTime(): DisplayTime {
  const workspace = useWorkspaceRecord();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const timeZone = member?.timeZone ?? workspace.timeZone;
  return {
    timeZone,
    dateFormat: member?.dateFormat ?? workspace.dateFormat,
    timeFormat: member?.timeFormat ?? workspace.timeFormat,
    workspaceTimeZone: workspace.timeZone,
    isOwnZone: timeZone !== workspace.timeZone,
  };
}
