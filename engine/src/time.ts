// File : /TeamSamsara.Workflow/engine/src/time.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Dates and times in a time zone, the same in the browser and on
// the server: the calendar day, a date or time in the workspace's format, a
// zone's offset, and wall-clock times (moved here from the app's shared/time).

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

const minutesPerHour = 60;

/** Minutes ahead of UTC (negative when behind) for a zone at a moment. */
export function utcOffsetMinutes(timeZone: string, at: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
  // "GMT-05:00", "GMT+05:30", or just "GMT" for UTC itself.
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? "");
  if (!match) return 0;
  const [, sign, hours, minutes] = match;
  const total = Number(hours) * minutesPerHour + Number(minutes);
  return sign === "-" ? -total : total;
}

/** A date and clock time as people read it in one time zone. */
export interface WallTime {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  /** 0 to 23. */
  hour: number;
  minute: number;
}

const millisecondsPerMinute = 60_000;

/** The wall-clock date and time of a moment in a time zone. */
export function toWallTime(date: Date, timeZone: string): WallTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

/**
 * The moment a wall-clock time happens in a time zone. A time the clocks skip
 * (2:30 AM on the spring-forward night) lands just after the jump; a time that
 * happens twice (the fall-back hour) is the first of the two.
 */
export function fromWallTime(wall: WallTime, timeZone: string): Date {
  // Date.UTC rolls days, months and hours over, so wall times may overflow.
  const asIfUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
  );
  const halfDay = 12 * 60 * millisecondsPerMinute;
  // The zone's offset before and after any change on that day.
  const offsets = [
    utcOffsetMinutes(timeZone, new Date(asIfUtc - halfDay)),
    utcOffsetMinutes(timeZone, new Date(asIfUtc + halfDay)),
  ];
  const fits = offsets
    .map((offset) => asIfUtc - offset * millisecondsPerMinute)
    .filter(
      (moment, index) =>
        utcOffsetMinutes(timeZone, new Date(moment)) === offsets[index],
    );
  if (fits.length > 0) return new Date(Math.min(...fits));
  // Skipped by the clocks: count on with the offset from before the jump.
  return new Date(asIfUtc - offsets[0] * millisecondsPerMinute);
}

/** The same wall-clock time a number of calendar days later (or earlier). */
export function addCalendarDays(
  date: Date,
  days: number,
  timeZone: string,
): Date {
  const wall = toWallTime(date, timeZone);
  return fromWallTime({ ...wall, day: wall.day + days }, timeZone);
}
