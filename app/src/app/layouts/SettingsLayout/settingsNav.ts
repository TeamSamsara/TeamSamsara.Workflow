// File : /TeamSamsara.Workflow/app/src/app/layouts/SettingsLayout/settingsNav.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The settings menu, in order: where each page lives and its label.

import { RoutePaths, type RoutePath } from "@/shared/constants/routePaths";
import { SettingsLayoutText } from "./settingsLayoutContent";

export interface SettingsNavItem {
  to: RoutePath;
  label: string;
}

export const settingsNav: readonly SettingsNavItem[] = [
  { to: RoutePaths.settingsGeneral, label: SettingsLayoutText.general },
  { to: RoutePaths.settingsMembers, label: SettingsLayoutText.members },
  { to: RoutePaths.settingsRoles, label: SettingsLayoutText.roles },
  { to: RoutePaths.settingsGroups, label: SettingsLayoutText.groups },
  { to: RoutePaths.settingsPlatforms, label: SettingsLayoutText.platforms },
  { to: RoutePaths.settingsTaskSetup, label: SettingsLayoutText.taskSetup },
];
