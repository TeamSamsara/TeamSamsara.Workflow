// File : /TeamSamsara.Workflow/app/src/views/system/ForbiddenView.tsx
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Shown in place of a page the signed-in member has no permission for,
// at the same address, with a way to their own tasks.

import { LinkButton } from "@/shared/components/Button/LinkButton";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { RoutePaths } from "@/shared/constants/routePaths";
import { ForbiddenViewText } from "./systemViewsContent";
import styles from "./SystemView.module.css";

export function ForbiddenView() {
  return (
    <div className={styles.page}>
      <StatusPanel
        className={styles.panel}
        icon="permission"
        title={ForbiddenViewText.title}
        actions={
          <LinkButton to={RoutePaths.myTasks} variant="primary">
            {ForbiddenViewText.goToMyTasks}
          </LinkButton>
        }
      >
        <p>{ForbiddenViewText.body}</p>
      </StatusPanel>
    </div>
  );
}
