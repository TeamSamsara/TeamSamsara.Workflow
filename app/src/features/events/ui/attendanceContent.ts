// File : /TeamSamsara.Workflow/app/src/features/events/ui/attendanceContent.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The words for asking people to reply: the planning part of the
// event form, "Are you going?", who's coming, and the calendar's marks.

import type { ReplyState } from "../model/attendance";
import type { ReplyAnswer } from "../types/attendance";

export const AttendanceFormText = {
  ask: "Ask people to reply",
  askHelp: "Each person answers Going, Maybe or Can't go.",
  required: "Who's required",
  allRequired: "All required",
  allOptional: "All optional",
  choiceLabel: (name: string) => `${name}: required or optional`,
  choices: { required: "Required", optional: "Optional" },
  noPeople: "Add people to the event to choose who's required.",
  laterNote: "People added to the event later are asked too, as optional.",
  everyReply: "Tell me about every reply",
  everyReplyHelp:
    "You're always told when someone required can't go. The event page shows everyone's answer either way.",
} as const;

export const answerLabels: Record<ReplyState, string> = {
  going: "Going",
  maybe: "Maybe",
  cant: "Can't go",
  waiting: "No reply yet",
};

/** Shorter, for the count tiles. */
export const countLabels: Record<ReplyState, string> = {
  ...answerLabels,
  waiting: "No reply",
};

export const ReplyText = {
  title: "Are you going?",
  required: "Required",
  optional: "Optional",
  askedBy: (name: string) =>
    `${name} asked for replies. You can change yours any time.`,
  asked: "You're asked to reply. You can change yours any time.",
  answersLabel: "Your reply",
  note: "Add a note",
  noteOptional: "(optional)",
  notePlaceholders: {
    going: "Like: 15 min late",
    maybe: "Like: depends on my exam",
    cant: "A reason, if you want to give one",
  } satisfies Record<ReplyAnswer, string>,
  saveNote: "Save note",
  saved: (answer: string) => `Replied: ${answer}`,
  failed: "Your reply wasn't saved",
  send: "Send",
  back: "Back",
  change: "Change",
  youReplied: (answer: string) => `You replied: ${answer}`,
  reasonLabel: "Add a reason",
  reasonPlaceholder: "Like: away that weekend",
} as const;

export const AttendanceText = {
  title: "Attendance",
  remind: (count: number) =>
    count === 1
      ? "Remind 1 who hasn't replied"
      : `Remind ${count} who haven't replied`,
  reminded: (count: number) =>
    count === 1 ? "Reminded 1 person" : `Reminded ${count} people`,
  remindFailed: "Reminders not sent",
  requiredGroup: (count: number) => `Required · ${count}`,
  optionalGroup: (count: number) => `Optional · ${count}`,
  nobody: "Nobody is in this event yet.",
  you: (name: string) => `${name} (you)`,
  free: (free: number, total: number) =>
    `Their availability says ${free} of ${total} can make it.`,
} as const;

/** The calendar's mark for the member's own reply. */
export const replyMarks: Record<ReplyState, string> = {
  going: "You're going",
  maybe: "You said maybe",
  cant: "You can't go",
  waiting: "Waiting on your reply",
};
