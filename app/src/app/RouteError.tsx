// File : /TeamSamsara.Workflow/app/src/app/RouteError.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : What shows when a page fails to load or throws while drawing. An
// unknown address gets the not-found page; anything else offers a retry.

import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { RoutePaths } from "@/shared/constants/routePaths";
import { NotFoundView } from "@/views/system/NotFoundView";
import { RouteErrorText } from "./appErrorContent";
import styles from "./AppError.module.css";

const notFoundStatus = 404;

export function RouteError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === notFoundStatus) {
    return (
      <div className={styles.page}>
        <NotFoundView />
      </div>
    );
  }

  return (
    <div className={styles.page} role="alert">
      <StatusPanel
        className={styles.panel}
        icon="error"
        tone="error"
        title={RouteErrorText.title}
        actions={
          <>
            <Button
              variant="primary"
              iconStart="reset"
              onClick={() => window.location.reload()}
            >
              {RouteErrorText.tryAgain}
            </Button>
            <LinkButton to={RoutePaths.calendar}>
              {RouteErrorText.backToCalendar}
            </LinkButton>
          </>
        }
      >
        <p>{RouteErrorText.body}</p>
      </StatusPanel>
    </div>
  );
}
