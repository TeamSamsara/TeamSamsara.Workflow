// File : /TeamSamsara.Workflow/app/src/features/notifications/hooks/useNotifications.ts
// Version : 1.0.0
// Latest commit: feature/notifications
// Author : Gerrah
// Purpose : The signed-in person's latest notifications, live, newest first,
// with how many are unread; and their notification settings.

import { collection, limit, orderBy, query, where } from "firebase/firestore";
import { useMemo } from "react";
import {
  Collections,
  createConverter,
  useLiveDocument,
  useLiveQueries,
} from "@/core/data";
import { useSession } from "@/core/session";
import {
  notificationConverter,
  readNotificationSettings,
  type NotificationRecord,
  type NotificationSettings,
} from "../types/notificationTypes";

/** The most kept in the list; older ones drop off it. */
const shown = 60;

export interface NotificationList {
  status: "loading" | "ready" | "error";
  items: NotificationRecord[];
  unread: number;
}

function useMemberId(): string | null {
  const session = useSession();
  return session.status === "active" ? session.member.id : null;
}

export function useNotifications(): NotificationList {
  const memberId = useMemberId();
  const result = useLiveQueries(
    memberId ? `notifications:${memberId}` : null,
    (database) => [
      query(
        collection(database, Collections.notifications),
        where("memberId", "==", memberId),
        orderBy("createdAt", "desc"),
        limit(shown),
      ).withConverter(notificationConverter),
    ],
    (note) => note.id,
  );
  return useMemo<NotificationList>(() => {
    if (result.status === "error")
      return { status: "error", items: [], unread: 0 };
    if (result.status !== "ready")
      return { status: "loading", items: [], unread: 0 };
    const items = [...(result.data ?? [])].sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? Infinity) -
        (a.createdAt?.getTime() ?? Infinity),
    );
    return {
      status: "ready",
      items,
      unread: items.filter((note) => !note.readAt).length,
    };
  }, [result]);
}

const settingsConverter = createConverter<NotificationSettings>({
  parse: (_id, data) => readNotificationSettings(data),
  serialize: (settings) => ({ ...settings }),
});

/** Their settings (the defaults until they save some); undefined while loading. */
export function useNotificationSettings(): NotificationSettings | undefined {
  const memberId = useMemberId();
  const result = useLiveDocument(
    memberId ? `${Collections.notificationSettings}/${memberId}` : null,
    settingsConverter,
  );
  if (result.status === "ready")
    return result.data ?? readNotificationSettings(undefined);
  if (result.status === "error") return readNotificationSettings(undefined);
  return undefined;
}
