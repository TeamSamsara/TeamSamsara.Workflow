// File : /TeamSamsara.Workflow/app/src/views/auth/NoAccessView.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : Where a signed-in account without access lands: why, and a way to
// sign out and try another account. Anyone else is sent where they belong.

import { Navigate, useNavigate } from "react-router-dom";
import { SessionLoading, signOut, useSession } from "@/core/session";
import { Button } from "@/shared/components/Button/Button";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { RoutePaths } from "@/shared/constants/routePaths";
import { NoAccessViewText } from "./noAccessViewContent";
import styles from "./AuthView.module.css";

export function NoAccessView() {
  const session = useSession();
  const navigate = useNavigate();

  if (session.status === "loading") return <SessionLoading />;
  if (session.status === "signedOut") {
    return <Navigate to={RoutePaths.signIn} replace />;
  }
  if (session.status !== "noAccess") {
    return <Navigate to={RoutePaths.calendar} replace />;
  }

  async function handleSignOut() {
    await signOut();
    navigate(RoutePaths.signIn, { replace: true });
  }

  return (
    <StatusPanel
      icon="lock"
      title={NoAccessViewText.title}
      actions={
        <Button variant="primary" iconStart="logOut" onClick={handleSignOut}>
          {NoAccessViewText.signOut}
        </Button>
      }
    >
      <p>{NoAccessViewText.signedInAs(session.user.email)}</p>
      <p>{NoAccessViewText.reasons[session.reason]}</p>
      <p className={styles.note}>{NoAccessViewText.contactAdmin}</p>
    </StatusPanel>
  );
}
