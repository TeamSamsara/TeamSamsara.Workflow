// File : /TeamSamsara.Workflow/app/src/shared/time/dates.ts
// Version : 1.1.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : Writes dates the way the app shows them, in a given time zone:
// "Oct 3, 2026", and "Today" / "Yesterday" / "Dec 10" for recent activity
// (the year is added when it isn't this year), and dates and times in the
// workspace's chosen formats.

import { TimeText } from "./timeContent";

const locale = "en-US";

/**
 * How a workspace writes dates: "Mon, Dec 14", "Dec 14", "14 Dec" or
 * "2026-12-14". The first is the default.
 */
export const DateFormats = [
  "weekdayMonthDay",
  "monthDay",
  "dayMonth",
  "isoDate",
] as const;
export type DateFormat = (typeof DateFormats)[number];

/** How a workspace writes times: "7:00 PM" or "19:00". */
export type ClockFormat = "12h" | "24h";

/** The calendar day in a time zone, as "2026-10-03", for comparing days. */
export function dayKey(date: Date, timeZone: string): string {
  // en-CA writes dates as year-month-day.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function yearOf(date: Date, timeZone: string): string {
  return dayKey(date, timeZone).slice(0, 4);
}

/** "Oct 3, 2026" */
export function formatLongDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** "Dec 10", or "Dec 10, 2025" when it isn't this year. */
export function formatShortDate(
  date: Date,
  timeZone: string,
  now: Date = new Date(),
): string {
  const sameYear = yearOf(date, timeZone) === yearOf(now, timeZone);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

const dayMs = 24 * 60 * 60 * 1000;

/** "Today", "Yesterday", or the short date; "Never" for no date. */
export function formatRecentDay(
  date: Date | null,
  timeZone: string,
  now: Date = new Date(),
): string {
  if (!date) return TimeText.never;
  const day = dayKey(date, timeZone);
  if (day === dayKey(now, timeZone)) return TimeText.today;
  if (day === dayKey(new Date(now.getTime() - dayMs), timeZone)) {
    return TimeText.yesterday;
  }
  return formatShortDate(date, timeZone, now);
}

const dateFormatOptions: Record<
  Exclude<DateFormat, "isoDate">,
  Intl.DateTimeFormatOptions
> = {
  weekdayMonthDay: { weekday: "short", month: "short", day: "numeric" },
  monthDay: { month: "short", day: "numeric" },
  dayMonth: { day: "numeric", month: "short" },
};

/** A date in the workspace's format ("Mon, Dec 14", "14 Dec", "2026-12-14"…). */
export function formatDate(
  date: Date,
  timeZone: string,
  format: DateFormat,
): string {
  if (format === "isoDate") return dayKey(date, timeZone);
  // en-GB puts the day first ("14 Dec"); the other formats read the US way.
  const formatLocale = format === "dayMonth" ? "en-GB" : locale;
  return new Intl.DateTimeFormat(formatLocale, {
    timeZone,
    ...dateFormatOptions[format],
  }).format(date);
}

/** A time in the workspace's format: "7:00 PM" or "19:00". */
export function formatTime(
  date: Date,
  timeZone: string,
  format: ClockFormat,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: format === "24h" ? "h23" : "h12",
  }).format(date);
}
