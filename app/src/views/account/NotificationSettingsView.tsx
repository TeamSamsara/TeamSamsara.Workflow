// File : /TeamSamsara.Workflow/app/src/views/account/NotificationSettingsView.tsx
// Version : 1.0.0
// Latest commit: feature/notifications
// Author : Gerrah
// Purpose : Your account › Notifications: what Playbook tells you about,
// where, and when it reminds you.

import { Link } from "react-router-dom";
import {
  NotificationSettingsForm,
  NotificationSettingsText as Text,
  useNotificationSettings,
} from "@/features/notifications";
import { RoutePaths } from "@/shared/constants/routePaths";
import styles from "./NotificationSettingsView.module.css";

export function NotificationSettingsView() {
  const settings = useNotificationSettings();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={RoutePaths.account} className={styles.crumb}>
          {Text.crumb}
        </Link>
        <h1 className={styles.title}>{Text.title}</h1>
        <p className={styles.muted}>{Text.description}</p>
      </header>
      {settings ? <NotificationSettingsForm settings={settings} /> : null}
    </div>
  );
}
