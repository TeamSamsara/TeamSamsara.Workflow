// File : /TeamSamsara.Workflow/app/src/features/notifications/index.ts
// Version : 1.0.0
// Latest commit: feature/notifications
// Author : Gerrah
// Purpose : What the rest of the app may use from notifications: the bell,
// the list, the settings form and signing out everywhere.

export {
  useNotifications,
  useNotificationSettings,
} from "./hooks/useNotifications";
export { signOutEverywhere } from "./service/notificationService";
export { NotificationBell } from "./ui/NotificationBell";
export { NotificationList } from "./ui/NotificationList";
export { NotificationSettingsForm } from "./ui/NotificationSettingsForm";
export { NotificationSettingsText } from "./ui/notificationsContent";
