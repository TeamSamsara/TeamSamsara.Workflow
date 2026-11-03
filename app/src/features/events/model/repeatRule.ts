// File : /TeamSamsara.Workflow/app/src/features/events/model/repeatRule.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : Which dates a repeat falls on. Works on calendar dates
// ("2026-11-09"), so daylight saving never moves an event; the time of day is
// put on each date in the workspace's time zone afterwards.

import { fromWallTime } from "@/shared/time/zonedTime";
import type { RepeatSchedule } from "../types/repeatTypes";

const pad = (value: number) => String(value).padStart(2, "0");

function toUtc(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(key: string, days: number): string {
  const date = toUtc(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toKey(date);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: string): number {
  return toUtc(key).getUTCDay();
}

/**
 * The dates the repeat falls on between from and to (both included), without
 * skipped dates, stopping at its end. A count-based end counts from the start,
 * not counting skipped dates.
 */
export function repeatDates(
  schedule: RepeatSchedule,
  from: string,
  to: string,
): string[] {
  if (schedule.weekdays.length === 0 || !schedule.startDate) return [];
  const skipped = new Set(schedule.skipDates);
  const last =
    schedule.endKind === "onDate" && schedule.endDate && schedule.endDate < to
      ? schedule.endDate
      : to;
  const dates: string[] = [];
  let counted = 0;
  // A count-based end has to count from the start, even before "from".
  const begin =
    schedule.endKind === "afterCount" || from < schedule.startDate
      ? schedule.startDate
      : from;
  for (let key = begin; key <= last; key = addDays(key, 1)) {
    if (!schedule.weekdays.includes(weekdayOf(key)) || skipped.has(key))
      continue;
    counted += 1;
    if (schedule.endKind === "afterCount" && counted > (schedule.endCount ?? 0))
      break;
    if (key >= from) dates.push(key);
  }
  return dates;
}

/** The moment an occurrence starts: its date at the repeat's time, in the zone. */
export function occurrenceStart(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (/^\d{2}:\d{2}$/.test(time) ? time : "19:00")
    .split(":")
    .map(Number);
  return fromWallTime({ year, month, day, hour, minute }, timeZone);
}

/** The id of a repeat's event on a date, the same whoever makes it. */
export function occurrenceId(repeatId: string, date: string): string {
  return `${repeatId}_${date}`;
}

/** The date in an occurrence's id, or null for an event that isn't one. */
export function occurrenceDate(
  eventId: string,
  repeatId: string | null,
): string | null {
  if (!repeatId || !eventId.startsWith(`${repeatId}_`)) return null;
  const date = eventId.slice(repeatId.length + 1);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}
