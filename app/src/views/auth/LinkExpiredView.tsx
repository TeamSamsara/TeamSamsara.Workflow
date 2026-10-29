// File : /TeamSamsara.Workflow/app/src/views/auth/LinkExpiredView.tsx
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : The page for an old or already-used email link, explaining what to do
// for an invite and for a reset.

import { LinkButton } from "@/shared/components/Button/LinkButton";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { RoutePaths } from "@/shared/constants/routePaths";
import { LinkExpiredViewText } from "./linkExpiredViewContent";
import styles from "./AuthView.module.css";

export function LinkExpiredView() {
  return (
    <StatusPanel
      icon="time"
      tone="alert"
      title={LinkExpiredViewText.title}
      actions={
        <>
          <LinkButton to={RoutePaths.forgotPassword} variant="primary">
            {LinkExpiredViewText.newLink}
          </LinkButton>
          <LinkButton to={RoutePaths.signIn}>
            {LinkExpiredViewText.backToSignIn}
          </LinkButton>
        </>
      }
    >
      <p>{LinkExpiredViewText.body}</p>
      <ul className={styles.tips}>
        <li>
          <p className={styles.question}>
            {LinkExpiredViewText.inviteQuestion}
          </p>
          <p className={styles.note}>{LinkExpiredViewText.inviteAnswer}</p>
        </li>
        <li>
          <p className={styles.question}>{LinkExpiredViewText.resetQuestion}</p>
          <p className={styles.note}>{LinkExpiredViewText.resetAnswer}</p>
        </li>
      </ul>
    </StatusPanel>
  );
}
