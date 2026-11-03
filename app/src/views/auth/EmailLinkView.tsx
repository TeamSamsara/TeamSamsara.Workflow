// File : /TeamSamsara.Workflow/app/src/views/auth/EmailLinkView.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The page every Firebase email link opens (the action URL set in the
// console). A good link shows the set-password form, worded for an invite or a
// reset; an old or used one goes to Link expired. Saving signs the person in.

import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthHeading, SetPasswordForm, usePasswordLink } from "@/features/auth";
import { Button } from "@/shared/components/Button/Button";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { RoutePaths } from "@/shared/constants/routePaths";
import { EmailLinkViewText } from "./emailLinkViewContent";
import styles from "./AuthView.module.css";

export function EmailLinkView() {
  const location = useLocation();
  const navigate = useNavigate();
  const check = usePasswordLink(location.search);

  switch (check.status) {
    case "expired":
      return <Navigate to={RoutePaths.linkExpired} replace />;

    case "checking":
      return (
        <div className={styles.checking}>
          <Spinner label={EmailLinkViewText.checking} />
        </div>
      );

    case "error":
      return (
        <StatusPanel
          icon="warning"
          tone="alert"
          title={EmailLinkViewText.errorTitle}
          actions={
            <Button variant="primary" iconStart="reset" onClick={check.retry}>
              {EmailLinkViewText.tryAgain}
            </Button>
          }
        >
          <p>{check.message}</p>
        </StatusPanel>
      );

    case "valid": {
      const isInvite = check.link.purpose === "invite";
      return (
        <div className={styles.view}>
          <AuthHeading
            title={
              isInvite
                ? EmailLinkViewText.inviteTitle
                : EmailLinkViewText.resetTitle
            }
            description={
              isInvite
                ? EmailLinkViewText.inviteDescription
                : EmailLinkViewText.resetDescription(check.email)
            }
          />
          <SetPasswordForm
            code={check.link.code}
            email={check.email}
            onDone={() => navigate(RoutePaths.calendar, { replace: true })}
            onExpired={() =>
              navigate(RoutePaths.linkExpired, { replace: true })
            }
          />
        </div>
      );
    }
  }
}
