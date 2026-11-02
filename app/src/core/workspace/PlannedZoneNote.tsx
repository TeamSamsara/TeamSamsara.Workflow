// File : /TeamSamsara.Workflow/app/src/core/workspace/PlannedZoneNote.tsx
// Version : 1.0.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : A one-line note on forms that set times, for people who see times
// in their own zone: what they type here is in the workspace's time zone.
// Shows nothing for everyone else.

import { zoneCity } from "@/shared/time/timeZones";
import { useDisplayTime } from "./useDisplayTime";
import { WorkspaceText } from "./workspaceContent";
import styles from "./PlannedZoneNote.module.css";

export function PlannedZoneNote() {
  const time = useDisplayTime();
  if (!time.isOwnZone) return null;
  return (
    <p className={styles.note}>
      {WorkspaceText.plannedZone(
        zoneCity(time.workspaceTimeZone),
        zoneCity(time.timeZone),
      )}
    </p>
  );
}
