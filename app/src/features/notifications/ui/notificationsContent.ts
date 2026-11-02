// File : /TeamSamsara.Workflow/app/src/features/notifications/ui/notificationsContent.ts
// Version : 1.1.0
// Latest commit: fix/modal-and-account-notifications
// Author : Gerrah
// Purpose : The words of notifications: the bell, the list, each kind of
// notification, and the settings page.

import type {
  EventReminder,
  SettingGroup,
  TaskReminder,
} from "../types/notificationTypes";

/** Where notification settings sit on Your account (its link from the bell). */
export const accountNotificationsId = "notifications";

export const NotificationListText = {
  title: "Notifications",
  bell: (unread: number) =>
    unread === 0 ? "Notifications" : `Notifications, ${unread} unread`,
  markAllRead: "Mark all read",
  settings: "Notification settings",
  all: "All",
  unread: (count: number) => `Unread · ${count}`,
  today: "Today",
  earlier: "Earlier",
  empty: "Nothing yet. When something needs you, it shows up here.",
  caughtUp: "You're all caught up.",
  failed: "Couldn't load your notifications.",
  unreadMark: "Unread",
  someone: "Someone",
  justNow: "Just now",
  minutesAgo: (count: number) => `${count} min ago`,
  hoursAgo: (count: number) => `${count} h ago`,
  yesterday: "Yesterday",
} as const;

export const NotificationSettingsText = {
  title: "Notifications",
  description:
    "What Playbook tells you about, and where. Nothing you do yourself notifies you.",
  crumb: "Your account",
  tellMe: "Tell me when",
  inApp: "In Playbook",
  email: "Email",
  discord: "Discord",
  discordSoon: (name: string) => `${name}, on Discord: coming soon`,
  comingSoon: "Discord notifications are coming soon",
  comingSoonBody: "They'll arrive with the Playbook bot for your server.",
  groups: {
    given: {
      name: "A task is given to me or my group",
      help: "Including when it moves to someone else, and its reminder.",
    },
    mine: {
      name: "My task is approved or sent back",
      help: "With what the reviewer asked to change.",
    },
    review: {
      name: "A task is sent to me to review",
      help: "For people who approve tasks.",
    },
    events: {
      name: "I'm added to an event, or one I'm in changes",
      help: "Moved or cancelled, and its reminder.",
    },
  } satisfies Record<SettingGroup, { name: string; help: string }>,
  switchLabel: (name: string, where: string) => `${name}, ${where}`,
  reminders: "Reminders",
  remindersHelp:
    "For tasks given to you and events you're in, sent where the rows above say.",
  taskReminder: "Before a task is due",
  eventReminder: "Before an event I'm in starts",
  taskReminders: {
    off: "Don't remind me",
    "1h": "1 hour before",
    "2h": "2 hours before",
    dayBefore: "The day before, at 9:00 AM",
  } satisfies Record<TaskReminder, string>,
  eventReminders: {
    off: "Don't remind me",
    "15m": "15 minutes before",
    "1h": "1 hour before",
    dayBefore: "The day before, at 9:00 AM",
  } satisfies Record<EventReminder, string>,
  save: "Save",
  saved: "Notification settings saved",
  failed: "Couldn't save",
  testEmail: "Send me a test email",
  testSent: (email: string) => `Test email sent to ${email}`,
  testFailed: "The test email didn't go out",
} as const;
