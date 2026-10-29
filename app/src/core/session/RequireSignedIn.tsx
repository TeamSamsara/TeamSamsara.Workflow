// File : /TeamSamsara.Workflow/app/src/core/session/RequireSignedIn.tsx
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Guards every signed-in page. Signed out goes to sign-in (remembering
// the page, to come back to it), no access goes to the No access page, and only
// an active member sees the page itself.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RoutePaths } from "@/shared/constants/routePaths";
import { returnPathState } from "./returnPath";
import { SessionLoading } from "./SessionLoading";
import { SessionUnavailable } from "./SessionUnavailable";
import { useSession } from "./useSession";

export function RequireSignedIn() {
  const session = useSession();
  const location = useLocation();

  switch (session.status) {
    case "loading":
      return <SessionLoading />;
    case "error":
      return <SessionUnavailable />;
    case "signedOut":
      return (
        <Navigate
          to={RoutePaths.signIn}
          replace
          state={returnPathState(location.pathname, location.search)}
        />
      );
    case "noAccess":
      return <Navigate to={RoutePaths.noAccess} replace />;
    case "active":
      return <Outlet />;
  }
}
