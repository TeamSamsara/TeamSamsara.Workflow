// File : /TeamSamsara.Workflow/app/src/features/platforms/service/platformSettingsService.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : Switches a platform on or off for the workspace. Needs Manage
// settings. Posts already planned for a platform keep their text either way.
// Also records which paid tiers (X Premium) the workspace's accounts have.

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

/** Says whether the workspace's account on this platform has its paid tier. */
export function setPlatformPremium(
  platformId: string,
  hasPremium: boolean,
): Promise<void> {
  return updateWorkspace({
    premiumPlatformIds: hasPremium
      ? arrayUnion(platformId)
      : arrayRemove(platformId),
  });
}
