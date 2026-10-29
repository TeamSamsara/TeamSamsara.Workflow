// File : /TeamSamsara.Workflow/app/src/app/layouts/SettingsLayout/settingsNav.ts
// Version : 1.1.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : The settings menu, in order: where each page lives, its label and the
// permission that opens it. The router guards the same pages with the same list.

import type { PermissionKey } from "@/core/access";
import { RoutePaths, type RoutePath } from "@/shared/constants/routePaths";
import { SettingsLayoutText } from "./settingsLayoutContent";

export interface SettingsNavItem {
  to: RoutePath;
  label: string;
  /** The permission that opens this page. */
  requires: PermissionKey;
}

export const settingsNav: readonly SettingsNavItem[] = [
  {
    to: RoutePaths.settingsGeneral,
    label: SettingsLayoutText.general,
    requires: "manageSettings",
  },
  {
    to: RoutePaths.settingsMembers,
    label: SettingsLayoutText.members,
    requires: "manageMembers",
  },
  {
    to: RoutePaths.settingsRoles,
    label: SettingsLayoutText.roles,
    requires: "manageRoles",
  },
  {
    to: RoutePaths.settingsGroups,
    label: SettingsLayoutText.groups,
    requires: "manageWorkGroups",
  },
  {
    to: RoutePaths.settingsPlatforms,
    label: SettingsLayoutText.platforms,
    requires: "manageSettings",
  },
  {
    to: RoutePaths.settingsTaskSetup,
    label: SettingsLayoutText.taskSetup,
    requires: "manageSettings",
  },
];
