// File : /TeamSamsara.Workflow/app/src/app/layouts/SettingsLayout/SettingsIndexRedirect.tsx
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Opening /settings goes to the first settings page the member may
// open, so someone who only manages members lands on Members, not on a page
// they can't see.

import { Navigate } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { RoutePaths } from "@/shared/constants/routePaths";
import { settingsNav } from "./settingsNav";

export function SettingsIndexRedirect() {
  const { can } = usePermissions();
  const first = settingsNav.find((item) => can(item.requires));
  return <Navigate to={first?.to ?? RoutePaths.calendar} replace />;
}
