// File : /TeamSamsara.Workflow/app/src/views/system/NotFoundView.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The page for an address no route claims, with a way back home.

import { LinkButton } from "@/shared/components/Button/LinkButton";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { RoutePaths } from "@/shared/constants/routePaths";
import { NotFoundViewText } from "./systemViewsContent";
import styles from "./SystemView.module.css";

export function NotFoundView() {
  return (
    <div className={styles.page}>
      <StatusPanel
        className={styles.panel}
        icon="search"
        title={NotFoundViewText.title}
        actions={
          <LinkButton to={RoutePaths.calendar} variant="primary">
            {NotFoundViewText.backToCalendar}
          </LinkButton>
        }
      >
        <p>{NotFoundViewText.body}</p>
      </StatusPanel>
    </div>
  );
}
