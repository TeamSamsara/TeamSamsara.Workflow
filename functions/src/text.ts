// File : /TeamSamsara.Workflow/functions/src/text.ts
// Version : 1.4.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The one-line sentence each notification says (an email's
// subject), and dates as the workspace writes them. The app words its own
// list the same way (notificationText).

import type { NotificationKind } from "./model.js";

export interface Said {
  actor: string | null;
  title: string;
  detail: string | null;
  /** The work group a task went to, when it went to a group. */
  group: string | null;
  /** Their reply, for "replied". */
  answer?: string | null;
}

export const answerWords: Record<string, string> = {
  going: "Going",
  maybe: "Maybe",
  cant: "Can't go",
};

/** One line saying what happened, used as the email's subject. */
export function sentence(kind: NotificationKind, said: Said): string {
  const who = said.actor ?? "Someone";
  switch (kind) {
    case "taskGiven":
      return said.group
        ? `${who} gave ${said.title} to ${said.group}`
        : `${who} gave you ${said.title}`;
    case "reviewAsked":
      return `${who} sent ${said.title} for your review`;
    case "taskApproved":
      return `${who} approved ${said.title}`;
    case "changesAsked":
      return `${who} asked for changes on ${said.title}`;
    case "eventAdded":
      return said.actor
        ? `${who} added you to ${said.title}`
        : `You're in ${said.title}`;
    case "eventMoved":
      return `${said.title} moved to ${said.detail ?? "a new time"}`;
    case "eventCancelled":
      return `${said.title} was cancelled`;
    case "taskDue":
      return `${said.title} is due ${said.detail ?? "soon"}`;
    case "eventSoon":
      return `${said.title} starts ${said.detail ?? "soon"}`;
    case "replyAsked":
      return `${who} asked you to reply to ${said.title}`;
    case "replyDeclined":
      return `${who} can't go to ${said.title}`;
    case "replied":
      return `${who} replied ${answerWords[said.answer ?? ""] ?? "to"} to ${said.title}`;
    case "setPlanned":
      return `${who} planned ${said.title}${said.detail ? `: ${said.detail}` : ""}`;
    case "tasksMoved":
      // No one by name: Playbook itself (a platform update or the background sync).
      return `${said.actor ?? "Playbook"} changed ${said.title}${said.detail ? `: ${said.detail}` : ""}`;
    case "tasksHandedOut":
      // Handed out by Playbook itself, for a group that does that.
      return `Playbook gave you ${said.title}`;
    case "taskWaiting":
      return `${said.title} is still waiting for someone${said.group ? ` in ${said.group}` : ""}`;
  }
}

export interface Formats {
  timeZone: string;
  clock: "12h" | "24h";
}

/** "Sat, Nov 14, 7:00 PM" in the workspace's time zone and clock. */
export function when(date: Date, formats: Formats): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: formats.timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: formats.clock === "24h" ? "h23" : "h12",
  }).format(date);
}
