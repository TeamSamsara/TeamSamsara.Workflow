// File : /TeamSamsara.Workflow/app/src/features/platforms/hooks/usePlatforms.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The platform catalogue joined with what this workspace has switched
// on: every platform for the settings page, and only the switched-on ones for
// planning posts.

import { useMemo } from "react";
import { useWorkspaceRecord } from "@/core/workspace";
import { limitsFor, PlatformCatalogue } from "../catalogue/platformCatalogue";
import type { Platform, PlatformSetting } from "../catalogue/platformTypes";

export interface PlatformList {
  /** Every platform in catalogue order, with whether it's on and the limits that apply. */
  settings: PlatformSetting[];
  /** Only the platforms this workspace uses. */
  enabled: Platform[];
}

export function usePlatforms(): PlatformList {
  const { enabledPlatformIds, upgradedPlatformIds } = useWorkspaceRecord();
  return useMemo(() => {
    const settings = PlatformCatalogue.map((platform) => {
      const upgraded = upgradedPlatformIds.includes(platform.id);
      return {
        platform,
        enabled: enabledPlatformIds.includes(platform.id),
        upgraded,
        limits: limitsFor(platform, upgraded),
      };
    });
    return {
      settings,
      enabled: settings
        .filter((entry) => entry.enabled)
        .map((entry) => entry.platform),
    };
  }, [enabledPlatformIds, upgradedPlatformIds]);
}
