// File : /TeamSamsara.Workflow/app/src/features/events/types/attendance.ts
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Asking the people in an event whether they're coming: whether
// it asks, who's required (everyone else is optional, so people added later
// start optional), whether the planner hears about every reply, and the
// replies themselves (Going, Maybe or Can't go, with an optional note).

import type { DocumentData } from "firebase/firestore";
import { readBoolean, readDate, readMap, readStringList } from "@/core/data";

export const ReplyAnswers = ["going", "maybe", "cant"] as const;
export type ReplyAnswer = (typeof ReplyAnswers)[number];

export interface EventReply {
  answer: ReplyAnswer;
  note: string;
  at: Date | null;
}

export interface Attendance {
  /** Whether the people in it are asked to reply. */
  asksReply: boolean;
  /** Who must come; everyone else in it is optional. */
  requiredIds: string[];
  /** Tell the planner about every reply, not only required people who can't go. */
  tellEveryReply: boolean;
}

/** Sizes the app keeps to (firestore.rules checks the same). */
export const AttendanceLimits = { required: 200, note: 300 } as const;

export const noAttendance: Attendance = {
  asksReply: false,
  requiredIds: [],
  tellEveryReply: false,
};

/** Events and repeats saved before attendance don't ask. */
export function readAttendance(data: DocumentData): Attendance {
  return {
    asksReply: readBoolean(data, "asksReply"),
    requiredIds: readStringList(data, "requiredIds"),
    tellEveryReply: readBoolean(data, "tellEveryReply"),
  };
}

const isAnswer = (value: unknown): value is ReplyAnswer =>
  (ReplyAnswers as readonly unknown[]).includes(value);

/** Each person's reply, by member id; odd entries are left out. */
export function readReplies(data: DocumentData): Record<string, EventReply> {
  const replies: Record<string, EventReply> = {};
  for (const [id, value] of Object.entries(readMap(data, "replies"))) {
    if (value === null || typeof value !== "object") continue;
    const entry = value as DocumentData;
    if (!isAnswer(entry.answer)) continue;
    replies[id] = {
      answer: entry.answer,
      note: typeof entry.note === "string" ? entry.note : "",
      at: readDate(entry, "at"),
    };
  }
  return replies;
}

/** What's saved: nothing left over when it doesn't ask. */
export function attendanceData(attendance: Attendance): Attendance {
  if (!attendance.asksReply) return noAttendance;
  return {
    asksReply: true,
    requiredIds: [...new Set(attendance.requiredIds)].slice(
      0,
      AttendanceLimits.required,
    ),
    tellEveryReply: attendance.tellEveryReply,
  };
}
