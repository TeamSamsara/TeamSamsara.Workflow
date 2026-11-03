// File : /TeamSamsara.Workflow/app/src/features/notifications/types/notificationTypes.ts
// Version : 1.1.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : A notification (written by the server functions, see
// functions/src/model.ts, which keeps the same kinds and settings) and each
// person's notification settings: which kinds, where, and when to remind.

import {
  createConverter,
  readDate,
  readOptionalString,
  readString,
} from "@/core/data";

export const NotificationKinds = [
  "taskGiven",
  "reviewAsked",
  "taskApproved",
  "changesAsked",
  "eventAdded",
  "eventMoved",
  "eventCancelled",
  "taskDue",
  "eventSoon",
  "replyAsked",
  "replyDeclined",
  "replied",
] as const;
export type NotificationKind = (typeof NotificationKinds)[number];

export interface NotificationRecord {
  id: string;
  memberId: string;
  kind: NotificationKind;
  /** Who made the change; null for reminders. */
  actorId: string | null;
  /** The task's or event's title when it happened. */
  title: string;
  /** The reviewer's words, the event's time… */
  detail: string | null;
  taskId: string | null;
  eventId: string | null;
  /** The work group a task went to, when it went to a group. */
  groupId: string | null;
  /** Someone's reply to an event ("going", "maybe", "cant"), for "replied". */
  answer: string | null;
  createdAt: Date | null;
  readAt: Date | null;
}

export const notificationConverter = createConverter<NotificationRecord>({
  parse: (id, data) => {
    const kind = readString(data, "kind");
    return {
      id,
      memberId: readString(data, "memberId"),
      kind: (NotificationKinds as readonly string[]).includes(kind)
        ? (kind as NotificationKind)
        : "taskGiven",
      actorId: readOptionalString(data, "actorId"),
      title: readString(data, "title"),
      detail: readOptionalString(data, "detail"),
      taskId: readOptionalString(data, "taskId"),
      eventId: readOptionalString(data, "eventId"),
      groupId: readOptionalString(data, "groupId"),
      answer: readOptionalString(data, "answer"),
      createdAt: readDate(data, "createdAt"),
      readAt: readDate(data, "readAt"),
    };
  },
  serialize: (note) =>
    Object.fromEntries(Object.entries(note).filter(([key]) => key !== "id")),
});

// #region Settings

export const SettingGroups = ["given", "mine", "review", "events"] as const;
export type SettingGroup = (typeof SettingGroups)[number];

export const TaskReminders = ["off", "1h", "2h", "dayBefore"] as const;
export type TaskReminder = (typeof TaskReminders)[number];
export const EventReminders = ["off", "15m", "1h", "dayBefore"] as const;
export type EventReminder = (typeof EventReminders)[number];

export interface NotificationSettings {
  app: Record<SettingGroup, boolean>;
  email: Record<SettingGroup, boolean>;
  taskReminder: TaskReminder;
  eventReminder: EventReminder;
}

export const defaultNotificationSettings: NotificationSettings = {
  app: { given: true, mine: true, review: true, events: true },
  email: { given: false, mine: false, review: true, events: false },
  taskReminder: "2h",
  eventReminder: "1h",
};

/** Saved settings with anything missing or odd as the defaults. */
export function readNotificationSettings(data: unknown): NotificationSettings {
  const value = (data ?? {}) as Record<string, unknown>;
  const flags = (stored: unknown, fallback: Record<SettingGroup, boolean>) => {
    const map = (stored ?? {}) as Record<string, unknown>;
    return Object.fromEntries(
      SettingGroups.map((group) => [
        group,
        typeof map[group] === "boolean" ? map[group] : fallback[group],
      ]),
    ) as Record<SettingGroup, boolean>;
  };
  const pick = <T extends string>(
    stored: unknown,
    options: readonly T[],
    fallback: T,
  ): T => options.find((option) => option === stored) ?? fallback;
  return {
    app: flags(value.app, defaultNotificationSettings.app),
    email: flags(value.email, defaultNotificationSettings.email),
    taskReminder: pick(value.taskReminder, TaskReminders, "2h"),
    eventReminder: pick(value.eventReminder, EventReminders, "1h"),
  };
}

// #endregion
