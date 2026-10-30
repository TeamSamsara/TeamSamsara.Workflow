// File : /TeamSamsara.Workflow/app/src/shared/time/zonedTime.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Moving between an exact moment and the wall-clock date and time in
// a time zone ("Saturday at 7:00 PM in Toronto"), so date maths follows the
// calendar people see, including the days the clocks change.

import { utcOffsetMinutes } from "./timeZones";

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
