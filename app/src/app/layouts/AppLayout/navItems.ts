// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/navItems.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The main menu, in order: where each item goes, its label and its icon.

import type { IconName } from "@/shared/icons/iconRegistry";
import { RoutePaths, type RoutePath } from "@/shared/constants/routePaths";
import { SidebarText } from "./sidebarContent";

export interface NavItem {
  to: RoutePath;
  label: string;
  icon: IconName;
  /** Only highlight on this exact address, not the pages under it. */
  end?: boolean;
}

export const navItems: readonly NavItem[] = [
  {
    to: RoutePaths.calendar,
    label: SidebarText.calendar,
    icon: "calendar",
    end: true,
  },
  { to: RoutePaths.myTasks, label: SidebarText.myTasks, icon: "myTasks" },
  { to: RoutePaths.workflows, label: SidebarText.workflows, icon: "workflows" },
  { to: RoutePaths.settings, label: SidebarText.settings, icon: "settings" },
];
