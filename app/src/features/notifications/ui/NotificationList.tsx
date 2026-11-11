// File : /TeamSamsara.Workflow/app/src/features/notifications/ui/NotificationList.tsx
// Version : 1.3.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The notification list, in the bell's panel and on its own page:
// a header with Mark all read and the settings, All / Unread, then Today and
// Earlier. Each one says who did what, with an icon for its kind; unread ones
// are tinted with a dot. Opening one marks it read and goes to its task or event.
// Being asked to reply to an event can be answered right there. Summaries
// (a set planned, tasks moved) add their counts and Show the tasks.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDisplayTime } from "@/core/workspace";
import { InlineReply } from "@/features/events";
import { memberName, useMembers } from "@/features/members";
import { useWorkGroups } from "@/features/work-groups";
import { Icon } from "@/shared/icons/Icon";
import type { IconName } from "@/shared/icons/iconRegistry";
import { useNow } from "@/shared/hooks/useNow";
import {
  eventPath,
  eventSetPath,
  RoutePaths,
  taskPath,
} from "@/shared/constants/routePaths";
import { formatDue } from "@/features/tasks";
import { dayKey, formatShortDate } from "@/shared/time/dates";
import { useNotifications } from "../hooks/useNotifications";
import { byDay, notificationLine, timeAgo } from "../model/notificationText";
import { markRead } from "../service/notificationService";
import { SummaryItem } from "./SummaryItem";
import type {
  NotificationKind,
  NotificationRecord,
} from "../types/notificationTypes";
import {
  accountNotificationsId,
  NotificationListText as Text,
} from "./notificationsContent";
import styles from "./NotificationList.module.css";

const look: Record<NotificationKind, { icon: IconName; tone: string }> = {
  taskGiven: { icon: "myTasks", tone: "task" },
  taskApproved: { icon: "check", tone: "task" },
  taskDue: { icon: "time", tone: "time" },
  reviewAsked: { icon: "showPassword", tone: "review" },
  changesAsked: { icon: "showPassword", tone: "review" },
  eventAdded: { icon: "calendar", tone: "event" },
  eventMoved: { icon: "calendar", tone: "event" },
  eventSoon: { icon: "time", tone: "time" },
  eventCancelled: { icon: "calendar", tone: "event" },
  replyAsked: { icon: "check", tone: "task" },
  replyDeclined: { icon: "warning", tone: "alert" },
  replied: { icon: "members", tone: "event" },
  setPlanned: { icon: "eventSets", tone: "event" },
  tasksMoved: { icon: "time", tone: "task" },
};

interface NotificationListProps {
  /** Called after one is opened (the panel closes itself). */
  onOpen?: () => void;
  /** The page shows its title as a page heading instead. */
  titleAs?: "h1" | "h2";
}

export function NotificationList({
  onOpen,
  titleAs: Title = "h2",
}: NotificationListProps) {
  const notes = useNotifications();
  const members = useMembers();
  const groups = useWorkGroups();
  const time = useDisplayTime();
  const now = useNow();
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const dayOf = (date: Date) => dayKey(date, time.timeZone);
  const shown = notes.items.filter((note) => !unreadOnly || !note.readAt);
  const unreadIds = notes.items
    .filter((note) => !note.readAt)
    .map((note) => note.id);
  const nameOf = (id: string | null) => {
    const member = id
      ? members.records.find((entry) => entry.id === id)
      : undefined;
    return member ? memberName(member) : null;
  };

  function open(note: NotificationRecord) {
    if (!note.readAt) void markRead([note.id]);
    const to = note.taskId
      ? taskPath(note.taskId)
      : note.eventId
        ? eventPath(note.eventId)
        : note.kind === "setPlanned" && note.setId
          ? eventSetPath(note.setId)
          : note.kind === "setPlanned" || note.kind === "tasksMoved"
            ? RoutePaths.myTasks
            : null;
    onOpen?.();
    if (to) navigate(to);
  }

  return (
    <div className={styles.list}>
      <div className={styles.head}>
        <Title className={styles.title}>{Text.title}</Title>
        {unreadIds.length > 0 ? (
          <button
            type="button"
            className={styles.markAll}
            onClick={() => void markRead(unreadIds)}
          >
            {Text.markAllRead}
          </button>
        ) : null}
        <Link
          to={`${RoutePaths.account}#${accountNotificationsId}`}
          className={styles.settings}
          aria-label={Text.settings}
          title={Text.settings}
          onClick={onOpen}
        >
          <Icon name="settings" />
        </Link>
      </div>
      <div className={styles.tabs} role="group" aria-label={Text.title}>
        <button
          type="button"
          aria-pressed={!unreadOnly}
          onClick={() => setUnreadOnly(false)}
        >
          {Text.all}
        </button>
        <button
          type="button"
          aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly(true)}
        >
          {Text.unread(unreadIds.length)}
        </button>
      </div>
      <div className={styles.scroll}>
        {notes.status === "error" ? (
          <p className={styles.empty}>{Text.failed}</p>
        ) : null}
        {notes.status === "ready" && shown.length === 0 ? (
          <p className={styles.empty}>
            {unreadOnly ? Text.caughtUp : Text.empty}
          </p>
        ) : null}
        {byDay(shown, now, dayOf).map((group) => (
          <section key={group.key} aria-label={Text[group.key]}>
            <h3 className={styles.day}>{Text[group.key]}</h3>
            <ul className={styles.items}>
              {group.items.map((note) => {
                const line = notificationLine(
                  note,
                  nameOf(note.actorId),
                  note.groupId
                    ? (groups.items.find(
                        (item) => item.group.id === note.groupId,
                      )?.group.name ?? null)
                    : null,
                );
                const kind = look[note.kind];
                return (
                  <li
                    key={note.id}
                    className={styles.entry}
                    data-unread={!note.readAt || undefined}
                  >
                    <button
                      type="button"
                      className={styles.item}
                      data-unread={!note.readAt || undefined}
                      onClick={() => open(note)}
                    >
                      <span className={styles.badge} data-tone={kind.tone}>
                        <Icon name={kind.icon} />
                      </span>
                      <span className={styles.text}>
                        <span>
                          {line.who ? <b>{line.who}</b> : null}
                          {line.who && line.what ? " " : null}
                          {line.what ? `${line.what} ` : null}
                          <b>{line.thing}</b>
                          {line.rest}
                        </span>
                        {line.quote ? (
                          <span className={styles.quote}>“{line.quote}”</span>
                        ) : null}
                        <span className={styles.meta}>
                          {timeAgo(note.createdAt, now, dayOf, (date) =>
                            formatShortDate(date, time.timeZone, now),
                          )}
                        </span>
                      </span>
                      {!note.readAt ? (
                        <span className={styles.dot}>
                          <span className={styles.hidden}>
                            {Text.unreadMark}
                          </span>
                        </span>
                      ) : null}
                    </button>
                    {note.summary ? (
                      <div className={styles.inline}>
                        <SummaryItem
                          summary={note.summary}
                          moved={note.kind === "tasksMoved"}
                          groupName={(id) =>
                            groups.items.find((item) => item.group.id === id)
                              ?.group.name ?? null
                          }
                          formatDue={(date) =>
                            formatDue(
                              date,
                              time.timeZone,
                              time.timeFormat,
                              time.dateFormat,
                              now,
                            )
                          }
                          onOpen={onOpen}
                        />
                      </div>
                    ) : null}
                    {note.kind === "replyAsked" && note.eventId ? (
                      <div className={styles.inline}>
                        <InlineReply eventId={note.eventId} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
