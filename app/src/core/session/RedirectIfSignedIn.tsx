// File : /TeamSamsara.Workflow/app/src/core/session/RedirectIfSignedIn.tsx
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Guards the sign-in pages. An active member is sent on to the page
// they were trying to open (or the calendar); everyone else sees the page.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RoutePaths } from "@/shared/constants/routePaths";
import { readReturnPath } from "./returnPath";
import { SessionLoading } from "./SessionLoading";
import { useSession } from "./useSession";

export function RedirectIfSignedIn() {
  const session = useSession();
  const location = useLocation();

  if (session.status === "loading") return <SessionLoading />;
  if (session.status === "active") {
    const destination = readReturnPath(location.state) ?? RoutePaths.calendar;
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}
