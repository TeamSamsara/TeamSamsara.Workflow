// File : /TeamSamsara.Workflow/app/src/views/notifications/NotificationsView.tsx
// Version : 1.0.0
// Latest commit: feature/notifications
// Author : Gerrah
// Purpose : The notification list on its own page, where the bell in the
// phone's top bar leads.

import { NotificationList } from "@/features/notifications";
import styles from "./NotificationsView.module.css";

export function NotificationsView() {
  return (
    <div className={styles.page}>
      <NotificationList titleAs="h1" />
    </div>
  );
}
