// File : /TeamSamsara.Workflow/app/src/features/platforms/hooks/usePlatforms.ts
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The platform catalogue joined with what this workspace has switched
// on (and which paid tiers its accounts have): every platform for the settings
// page, and only the switched-on ones for planning posts.

import { useMemo } from "react";
import { useWorkspaceRecord } from "@/core/workspace";
import { PlatformCatalogue } from "../catalogue/platformCatalogue";
import type { Platform, PlatformSetting } from "../catalogue/platformTypes";

export interface PlatformList {
  /** Every platform in catalogue order, with whether it's on. */
  settings: PlatformSetting[];
  /** Only the platforms this workspace uses. */
  enabled: Platform[];
  /** Whether the workspace's account has this platform's paid tier. */
  hasPremium: (platformId: string) => boolean;
}

export function usePlatforms(): PlatformList {
  const { enabledPlatformIds, premiumPlatformIds } = useWorkspaceRecord();
  return useMemo(() => {
    const settings = PlatformCatalogue.map((platform) => ({
      platform,
      enabled: enabledPlatformIds.includes(platform.id),
      hasPremium:
        Boolean(platform.premium) && premiumPlatformIds.includes(platform.id),
    }));
    return {
      settings,
      enabled: settings
        .filter((entry) => entry.enabled)
        .map((entry) => entry.platform),
      hasPremium: (platformId: string) =>
        settings.some(
          (entry) => entry.platform.id === platformId && entry.hasPremium,
        ),
    };
  }, [enabledPlatformIds, premiumPlatformIds]);
}
