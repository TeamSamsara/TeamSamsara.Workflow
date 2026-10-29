// File : /TeamSamsara.Workflow/app/src/app/AppErrorFallback.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : What shows when something outside the pages crashes (a provider, the
// router itself). It replaces the whole app, so it uses no router links.

import { Button } from "@/shared/components/Button/Button";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { AppErrorFallbackText } from "./appErrorContent";
import styles from "./AppError.module.css";

export function AppErrorFallback() {
  return (
    <div className={styles.page} role="alert">
      <StatusPanel
        className={styles.panel}
        icon="error"
        tone="error"
        title={AppErrorFallbackText.title}
        actions={
          <Button
            variant="primary"
            iconStart="reset"
            onClick={() => window.location.reload()}
          >
            {AppErrorFallbackText.reload}
          </Button>
        }
      >
        <p>{AppErrorFallbackText.body}</p>
      </StatusPanel>
    </div>
  );
}
