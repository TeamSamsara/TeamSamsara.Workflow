// File : /TeamSamsara.Workflow/app/src/features/notifications/model/notificationText.ts
// Version : 1.3.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : How a notification reads in the list: who (bold), what happened,
// the task or event (bold) and the rest, plus the reviewer's words when there
// are some. Also when it happened ("5 min ago") and which day group it's in.

import type { NotificationRecord } from "../types/notificationTypes";
import { NotificationListText as Text } from "../ui/notificationsContent";

export interface NotificationLine {
  who: string | null;
  what: string;
  thing: string;
  rest: string;
  quote: string | null;
}

export function notificationLine(
  note: Pick<NotificationRecord, "kind" | "title" | "detail" | "groupId"> &
    Partial<Pick<NotificationRecord, "answer">>,
  actor: string | null,
  groupName: string | null,
): NotificationLine {
  const who = actor ?? Text.someone;
  const line = (
    what: string,
    rest = ".",
    withWho = true,
  ): NotificationLine => ({
    who: withWho ? who : null,
    what,
    thing: note.title,
    rest,
    quote: null,
  });
  switch (note.kind) {
    case "taskGiven":
      return groupName ? line("gave", ` to ${groupName}.`) : line("gave you");
    case "reviewAsked":
      return line("sent", " for your review.");
    case "taskApproved":
      return line("approved");
    case "changesAsked":
      return { ...line("asked for changes on"), quote: note.detail };
    case "eventAdded":
      return actor ? line("added you to") : line("You're in", ".", false);
    case "eventMoved":
      return line("", ` moved to ${note.detail ?? "a new time"}.`, false);
    case "eventCancelled":
      return line("", " was cancelled.", false);
    case "taskDue":
      return line("", ` is due ${note.detail ?? "soon"}.`, false);
    case "eventSoon":
      return line("", ` starts ${note.detail ?? "soon"}.`, false);
    case "replyAsked":
      return line(
        "asked you to reply to",
        note.detail ? ` · ${note.detail}.` : ".",
      );
    case "replyDeclined":
      return { ...line("can't go to"), quote: note.detail };
    case "replied":
      return {
        ...line(Text.replied(Text.answers[note.answer ?? ""] ?? null)),
        quote: note.detail,
      };
    case "setPlanned":
      return line("planned", note.detail ? `: ${note.detail}.` : ".");
    case "tasksMoved":
      // No one by name: Playbook itself (a platform update or the background sync).
      return {
        ...line("changed", note.detail ? `. ${note.detail}` : "."),
        who: actor ?? Text.playbook,
      };
    case "tasksHandedOut":
      // Handed out by Playbook itself, for a group that does that.
      return { ...line("gave you"), who: Text.playbook };
    case "taskWaiting":
      return line(
        "",
        `${Text.stillWaiting(groupName)}${note.detail ? `, due ${note.detail}` : ""}.`,
        false,
      );
  }
}

const minute = 60 * 1000;
const hour = 60 * minute;

/** "Just now", "5 min ago", "3 h ago", "Yesterday", or a date. */
export function timeAgo(
  at: Date | null,
  now: Date,
  dayOf: (date: Date) => string,
  dateText: (date: Date) => string,
): string {
  if (!at) return Text.justNow;
  const since = now.getTime() - at.getTime();
  if (since < minute) return Text.justNow;
  if (since < hour) return Text.minutesAgo(Math.floor(since / minute));
  if (dayOf(at) === dayOf(now)) return Text.hoursAgo(Math.floor(since / hour));
  if (dayOf(at) === dayOf(new Date(now.getTime() - 24 * hour)))
    return Text.yesterday;
  return dateText(at);
}

/** Today's and earlier ones, newest first in each; empty groups left out. */
export function byDay<T extends { createdAt: Date | null }>(
  items: readonly T[],
  now: Date,
  dayOf: (date: Date) => string,
): { key: "today" | "earlier"; items: T[] }[] {
  const today = dayOf(now);
  const isToday = (item: T) =>
    !item.createdAt || dayOf(item.createdAt) === today;
  return [
    { key: "today" as const, items: items.filter(isToday) },
    { key: "earlier" as const, items: items.filter((item) => !isToday(item)) },
  ].filter((group) => group.items.length > 0);
}
