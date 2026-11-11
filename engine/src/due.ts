// File : /TeamSamsara.Workflow/engine/src/due.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : When a step's task is due, counted from its event's start in the
// workspace's time zone: at the start, or days, hours and minutes before or
// after it, or a clock time a number of days before or after.

import { addCalendarDays, fromWallTime, toWallTime } from "./time.js";

export type DueDirection = "before" | "at" | "after";

export interface DueOffset {
  direction: DueDirection;
  days: number;
  hours: number;
  minutes: number;
  /** "19:00", or null to count hours and minutes instead. */
  time: string | null;
}

const millisecondsPerMinute = 60_000;

/** "19:00" → hours and minutes, or null if it isn't a clock time. */
export function parseClockTime(
  time: string,
): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

/** The moment a task is due, for an event starting at `start`. */
export function resolveDue(
  start: Date,
  offset: DueOffset,
  timeZone: string,
): Date {
  if (offset.direction === "at") return start;
  const sign = offset.direction === "before" ? -1 : 1;
  const clock = offset.time ? parseClockTime(offset.time) : null;
  if (clock) {
    const wall = toWallTime(start, timeZone);
    return fromWallTime(
      {
        ...wall,
        day: wall.day + sign * offset.days,
        hour: clock.hour,
        minute: clock.minute,
      },
      timeZone,
    );
  }
  const shiftedDay = addCalendarDays(start, sign * offset.days, timeZone);
  const minutes = offset.hours * 60 + offset.minutes;
  return new Date(
    shiftedDay.getTime() + sign * minutes * millisecondsPerMinute,
  );
}
