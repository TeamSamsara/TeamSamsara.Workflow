// File : /TeamSamsara.Workflow/app/src/views/system/ComingSoonView.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : A stand-in for pages that are planned but not built yet, so every
// menu item already leads somewhere. Each feature PR replaces its use.

import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { ComingSoonViewText } from "./systemViewsContent";
import styles from "./SystemView.module.css";

export function ComingSoonView() {
  return (
    <div className={styles.page}>
      <StatusPanel
        className={styles.panel}
        icon="time"
        title={ComingSoonViewText.title}
      >
        <p>{ComingSoonViewText.body}</p>
      </StatusPanel>
    </div>
  );
}
