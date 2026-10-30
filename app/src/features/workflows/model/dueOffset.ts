// File : /TeamSamsara.Workflow/app/src/features/workflows/model/dueOffset.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Relative due times. Works out the moment a task is due from the
// event's start in the workspace's time zone, following the calendar across
// daylight saving changes, and says it in words.

import type { ClockFormat } from "@/shared/time/dates";
import {
  addCalendarDays,
  fromWallTime,
  toWallTime,
} from "@/shared/time/zonedTime";
import type { DueOffset } from "../types/workflowTypes";
import { DueOffsetText as Text } from "./dueOffsetContent";

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

/** "19:00" as "7:00 PM" or "19:00". */
export function formatClockTime(time: string, format: ClockFormat): string {
  const parsed = parseClockTime(time);
  if (!parsed) return time;
  const minutes = String(parsed.minute).padStart(2, "0");
  if (format === "24h") {
    return `${String(parsed.hour).padStart(2, "0")}:${minutes}`;
  }
  const hour12 = parsed.hour % 12 === 0 ? 12 : parsed.hour % 12;
  return `${hour12}:${minutes} ${parsed.hour < 12 ? "AM" : "PM"}`;
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

/** "At the start", "1 day 2 hours before", "Day before, 7:00 PM"… */
export function describeDue(offset: DueOffset, format: ClockFormat): string {
  if (offset.direction === "at") return Text.atStart;
  if (offset.time) {
    const time = formatClockTime(offset.time, format);
    if (offset.days === 0) return Text.sameDay(time);
    if (offset.days === 1) {
      return offset.direction === "before"
        ? Text.dayBefore(time)
        : Text.nextDay(time);
    }
    return offset.direction === "before"
      ? Text.daysBefore(offset.days, time)
      : Text.daysAfter(offset.days, time);
  }
  const parts = [
    offset.days > 0 ? Text.days(offset.days) : null,
    offset.hours > 0 ? Text.hours(offset.hours) : null,
    offset.minutes > 0 ? Text.minutes(offset.minutes) : null,
  ].filter((part): part is string => part !== null);
  if (parts.length === 0) return Text.atStart;
  const amount = parts.join(" ");
  return offset.direction === "before"
    ? Text.before(amount)
    : Text.after(amount);
}

/** Sorts steps by when they fall: the earliest due first. */
export function dueOrder(offset: DueOffset): number {
  if (offset.direction === "at") return 0;
  const sign = offset.direction === "before" ? -1 : 1;
  const clock = offset.time ? parseClockTime(offset.time) : null;
  // A clock time sorts within its day, a day being 1,440 minutes.
  const withinDay = clock
    ? clock.hour * 60 + clock.minute - 720
    : sign * (offset.hours * 60 + offset.minutes);
  return sign * offset.days * 1440 + withinDay;
}
