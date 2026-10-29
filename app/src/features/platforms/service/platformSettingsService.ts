// File : /TeamSamsara.Workflow/app/src/features/platforms/service/platformSettingsService.ts
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Switches a platform on or off for the workspace. Needs Manage
// settings. Posts already planned for a platform keep their text either way.

import { arrayRemove, arrayUnion } from "firebase/firestore";
import { updateWorkspace } from "@/core/workspace";

export function setPlatformEnabled(
  platformId: string,
  enabled: boolean,
): Promise<void> {
  // Changed in place, so two people switching different platforms at once
  // don't undo each other.
  return updateWorkspace({
    enabledPlatformIds: enabled
      ? arrayUnion(platformId)
      : arrayRemove(platformId),
  });
}
