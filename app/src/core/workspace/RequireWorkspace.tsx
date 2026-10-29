// File : /TeamSamsara.Workflow/app/src/core/workspace/RequireWorkspace.tsx
// Version : 1.0.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Guard in front of every page but setup: with no workspace yet, it
// sends the visitor to set one up; while loading it shows a spinner; when the
// workspace can't be read it offers to try again.

import { Navigate, Outlet } from "react-router-dom";
import { Button } from "@/shared/components/Button/Button";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { RoutePaths } from "@/shared/constants/routePaths";
import { useWorkspace } from "./useWorkspace";
import { WorkspaceText } from "./workspaceContent";
import styles from "./WorkspaceGate.module.css";

export function RequireWorkspace() {
  const workspace = useWorkspace();

  switch (workspace.status) {
    case "loading":
      return (
        <div className={styles.page}>
          <Spinner label={WorkspaceText.loading} />
        </div>
      );
    case "error":
      return (
        <div className={styles.page} role="alert">
          <StatusPanel
            className={styles.panel}
            icon="warning"
            tone="alert"
            title={WorkspaceText.unavailableTitle}
            actions={
              <Button
                variant="primary"
                iconStart="reset"
                onClick={() => window.location.reload()}
              >
                {WorkspaceText.tryAgain}
              </Button>
            }
          >
            <p>{WorkspaceText.unavailableBody}</p>
          </StatusPanel>
        </div>
      );
    case "missing":
      return <Navigate to={RoutePaths.setup} replace />;
    case "ready":
      return <Outlet />;
  }
}
