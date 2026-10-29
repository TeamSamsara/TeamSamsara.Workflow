// File : /TeamSamsara.Workflow/app/src/shared/time/dates.ts
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Writes dates the way the app shows them, in a given time zone:
// "Oct 3, 2026", and "Today" / "Yesterday" / "Dec 10" for recent activity
// (the year is added when it isn't this year).

import { TimeText } from "./timeContent";

const locale = "en-US";

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
