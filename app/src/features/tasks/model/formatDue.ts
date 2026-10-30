// File : /TeamSamsara.Workflow/app/src/features/tasks/model/formatDue.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : A due time the way people say it: "Today, 7:00 PM", "Tomorrow,
// 9:00 AM", "Mon, Nov 9, 7:00 PM", in the workspace's time zone and formats.
// Also turns a due time into the date and time boxes of a form, and back.

import {
  dayKey,
  formatDate,
  formatTime,
  type ClockFormat,
  type DateFormat,
} from "@/shared/time/dates";
import { fromWallTime, toWallTime } from "@/shared/time/zonedTime";
import { DueText } from "../ui/tasksContent";

const dayMs = 24 * 60 * 60 * 1000;

export function formatDue(
  dueAt: Date,
  timeZone: string,
  clock: ClockFormat,
  dateFormat: DateFormat,
  now: Date = new Date(),
): string {
  const day = dayKey(dueAt, timeZone);
  const time = formatTime(dueAt, timeZone, clock);
  if (day === dayKey(now, timeZone)) return DueText.at(DueText.today, time);
  if (day === dayKey(new Date(now.getTime() + dayMs), timeZone)) {
    return DueText.at(DueText.tomorrow, time);
  }
  if (day === dayKey(new Date(now.getTime() - dayMs), timeZone)) {
    return DueText.at(DueText.yesterday, time);
  }
  return DueText.at(formatDate(dueAt, timeZone, dateFormat), time);
}

const pad = (value: number) => String(value).padStart(2, "0");

/** A due time as the values of a date box and a time box. */
export function toDateAndTime(
  dueAt: Date | null,
  timeZone: string,
): { date: string; time: string } {
  if (!dueAt) return { date: "", time: "" };
  const wall = toWallTime(dueAt, timeZone);
  return {
    date: `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`,
    time: `${pad(wall.hour)}:${pad(wall.minute)}`,
  };
}

/** The moment a date box and time box mean; null without a date. */
export function fromDateAndTime(
  date: string,
  time: string,
  timeZone: string,
): Date | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!day) return null;
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  return fromWallTime(
    {
      year: Number(day[1]),
      month: Number(day[2]),
      day: Number(day[3]),
      // Without a time, due at the end of the working day.
      hour: clock ? Number(clock[1]) : 17,
      minute: clock ? Number(clock[2]) : 0,
    },
    timeZone,
  );
}
