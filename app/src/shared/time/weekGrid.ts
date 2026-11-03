// File : /TeamSamsara.Workflow/app/src/shared/time/weekGrid.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : The seven days of a week in the workspace's time zone: each day's
// key ("2026-11-02"), when it starts and ends, and whether it's today; plus
// moving a week back or forward and saying the week in words.

import { dayKey } from "./dates";
import { fromWallTime } from "./zonedTime";

export interface WeekDay {
  key: string;
  year: number;
  month: number;
  day: number;
  /** Midnight at the start of the day, in the time zone. */
  start: Date;
  /** Midnight at its end. */
  end: Date;
  isToday: boolean;
}

export interface Week {
  /** The first day's key, which names the week in the address. */
  key: string;
  days: WeekDay[];
  start: Date;
  end: Date;
}

const pad = (value: number) => String(value).padStart(2, "0");

function toUtc(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDayKeys(key: string, days: number): string {
  const date = toUtc(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toKey(date);
}

/** "2026-11-02", or null when the text isn't a date. */
export function parseDayKey(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(toUtc(value).getTime()) ? null : toKey(toUtc(value));
}

/** The first day of the week holding this day. */
export function weekStartKey(
  key: string,
  weekStartsOn: "monday" | "sunday",
): string {
  const first = weekStartsOn === "monday" ? 1 : 0;
  const lead = (toUtc(key).getUTCDay() - first + 7) % 7;
  return addDayKeys(key, -lead);
}

export function weekOf(
  key: string,
  weekStartsOn: "monday" | "sunday",
  timeZone: string,
  now: Date = new Date(),
): Week {
  const firstKey = weekStartKey(key, weekStartsOn);
  const today = dayKey(now, timeZone);
  const midnight = (dayKeyValue: string) => {
    const [year, month, day] = dayKeyValue.split("-").map(Number);
    return fromWallTime({ year, month, day, hour: 0, minute: 0 }, timeZone);
  };
  const days = Array.from({ length: 7 }, (_unused, index) => {
    const dayKeyValue = addDayKeys(firstKey, index);
    const [year, month, day] = dayKeyValue.split("-").map(Number);
    return {
      key: dayKeyValue,
      year,
      month,
      day,
      start: midnight(dayKeyValue),
      end: midnight(addDayKeys(dayKeyValue, 1)),
      isToday: dayKeyValue === today,
    };
  });
  return { key: firstKey, days, start: days[0].start, end: days[6].end };
}

/** "Oct 26 – Nov 1, 2026", or "Nov 2 – 8, 2026" within one month. */
export function formatWeek(week: Pick<Week, "days">): string {
  const first = week.days[0];
  const last = week.days[week.days.length - 1];
  const month = (value: { year: number; month: number }) =>
    new Date(Date.UTC(value.year, value.month - 1, 1)).toLocaleString("en", {
      month: "short",
      timeZone: "UTC",
    });
  const end =
    first.month === last.month ? `${last.day}` : `${month(last)} ${last.day}`;
  const startYear = first.year !== last.year ? `, ${first.year}` : "";
  return `${month(first)} ${first.day}${startYear} – ${end}, ${last.year}`;
}
