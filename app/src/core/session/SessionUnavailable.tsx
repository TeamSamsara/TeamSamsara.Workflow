// File : /TeamSamsara.Workflow/app/src/core/session/SessionUnavailable.tsx
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : What shows when someone is signed in but their member record can't be
// read (usually no connection on a first visit): try again, or sign out.

import { Button } from "@/shared/components/Button/Button";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { signOut } from "./authService";
import { SessionText } from "./sessionContent";
import styles from "./SessionGate.module.css";

export function SessionUnavailable() {
  return (
    <div className={styles.page} role="alert">
      <StatusPanel
        className={styles.panel}
        icon="warning"
        tone="alert"
        title={SessionText.unavailableTitle}
        actions={
          <>
            <Button
              variant="primary"
              iconStart="reset"
              onClick={() => window.location.reload()}
            >
              {SessionText.tryAgain}
            </Button>
            <Button iconStart="logOut" onClick={() => void signOut()}>
              {SessionText.signOut}
            </Button>
          </>
        }
      >
        <p>{SessionText.unavailableBody}</p>
      </StatusPanel>
    </div>
  );
}
