// File : /TeamSamsara.Workflow/app/src/features/notifications/service/notificationService.ts
// Version : 1.0.0
// Latest commit: feature/notifications
// Author : Gerrah
// Purpose : Marking notifications read, saving notification settings, and
// the two server calls: a test email, and signing out on every device.

import { doc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  Collections,
  commitWrites,
  serverTime,
  type BatchWrite,
} from "@/core/data";
import { db, functions } from "@/lib/firebase";
import type { NotificationSettings } from "../types/notificationTypes";

/** Marks these read (the ones not read yet). */
export function markRead(ids: readonly string[]): Promise<void> {
  return commitWrites(
    db,
    ids.map(
      (id): BatchWrite =>
        (batch) =>
          batch.update(doc(db, Collections.notifications, id), {
            readAt: serverTime(),
          }),
    ),
  );
}

export function saveNotificationSettings(
  memberId: string,
  settings: NotificationSettings,
): Promise<void> {
  return setDoc(doc(db, Collections.notificationSettings, memberId), {
    app: settings.app,
    email: settings.email,
    taskReminder: settings.taskReminder,
    eventReminder: settings.eventReminder,
    updatedAt: serverTime(),
  });
}

/** Emails the signed-in person, to check email works; gives back the address. */
export async function sendTestEmail(): Promise<string> {
  const call = httpsCallable<void, { sentTo: string }>(
    functions,
    "sendTestEmail",
  );
  return (await call()).data.sentTo;
}

/** Ends this person's sign-ins on every device (others within the hour). */
export async function signOutEverywhere(): Promise<void> {
  await httpsCallable(functions, "signOutEverywhere")();
}
