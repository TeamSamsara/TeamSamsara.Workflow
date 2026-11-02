// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/navItems.ts
// Version : 1.2.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : The main menu, in order: where each item goes, its label, its icon,
// and the permissions it needs to show.

import { ManagePermissions, type PermissionKey } from "@/core/access";
import type { IconName } from "@/shared/icons/iconRegistry";
import { RoutePaths, type RoutePath } from "@/shared/constants/routePaths";
import { SidebarText } from "./sidebarContent";

export interface NavItem {
  to: RoutePath;
  label: string;
  icon: IconName;
  /** Only highlight on this exact address, not the pages under it. */
  end?: boolean;
  /** Shown only to members holding at least one of these. */
  requiresAnyOf?: readonly PermissionKey[];
  /** Part of the item above it: shown smaller and indented under it. */
  sub?: boolean;
}

export const navItems: readonly NavItem[] = [
  {
    to: RoutePaths.calendar,
    label: SidebarText.calendar,
    icon: "calendar",
    end: true,
  },
  {
    to: RoutePaths.availability,
    label: SidebarText.availability,
    icon: "time",
    sub: true,
  },
  { to: RoutePaths.myTasks, label: SidebarText.myTasks, icon: "myTasks" },
  { to: RoutePaths.workflows, label: SidebarText.workflows, icon: "workflows" },
  {
    to: RoutePaths.settings,
    label: SidebarText.settings,
    icon: "settings",
    requiresAnyOf: ManagePermissions,
  },
];
