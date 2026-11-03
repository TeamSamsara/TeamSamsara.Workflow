// File : /TeamSamsara.Workflow/functions/src/text.ts
// Version : 1.1.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The words of notification emails, and dates as the workspace
// writes them. The app words its own list the same way (notificationText).

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

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** A short plain email: the line, the detail, a button to open it. */
export function emailBody(
  line: string,
  detail: string | null,
  link: string,
): { text: string; html: string } {
  const text = [
    line,
    detail ? `“${detail}”` : null,
    "",
    `Open Playbook: ${link}`,
  ]
    .filter((part) => part !== null)
    .join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#151d23;line-height:1.5">
<p style="margin:0 0 12px">${escape(line)}</p>
${detail ? `<p style="margin:0 0 16px;padding:10px 14px;background:#f3f3f3;border-radius:8px">${escape(detail)}</p>` : ""}
<a href="${escape(link)}" style="display:inline-block;padding:10px 18px;background:#95ff50;color:#151d23;border-radius:8px;text-decoration:none;font-weight:bold">Open in Playbook</a>
<p style="margin:20px 0 0;font-size:12px;color:#5b636a">You get this because of your notification settings in Playbook (Your account › Notifications).</p>
</div>`;
  return { text, html };
}
