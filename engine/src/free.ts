// File : /TeamSamsara.Workflow/engine/src/free.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : Whether someone is free at a moment: their usual week (the hours
// they're unavailable, per weekday), the dates that differ, and their personal
// appointments. Shared by Team availability in the app and by the server when
// it hands out tasks.

import { toWallTime } from "./time.js";

/** A date unlike the usual week: unavailable or available, all day or between two times. */
export interface DayException {
  /** "2026-11-14" */
  date: string;
  /** "18:00", or null for the whole day. */
  from: string | null;
  to: string | null;
  available: boolean;
}

export interface UsualWeek {
  /** Weekday (0 = Sunday) → hours (0-23) usually unavailable. */
  weekly: Readonly<Record<number, readonly number[]>>;
  exceptions: readonly DayException[];
  /** The zone the hours are in; null for the workspace's. */
  timeZone: string | null;
}

/** When someone is busy with a personal appointment. */
export interface BusyTime {
  startsAt: Date;
  endsAt: Date;
}

/** Half an hour: the step free time is checked in. */
export const FreeStep = 30 * 60_000;

const pad = (value: number) => String(value).padStart(2, "0");

function wallOf(instant: Date, timeZone: string) {
  const wall = toWallTime(instant, timeZone);
  const weekday = new Date(
    Date.UTC(wall.year, wall.month - 1, wall.day),
  ).getUTCDay();
  return {
    date: `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`,
    weekday,
    hour: wall.hour,
    clock: `${pad(wall.hour)}:${pad(wall.minute)}`,
  };
}

const covers = (exception: DayException, clock: string) =>
  exception.from === null ||
  exception.to === null ||
  (clock >= exception.from && clock < exception.to);

/**
 * Whether the usual week and the exceptions leave this moment free. They're
 * read in the zone the member painted them in, else the one given. Someone
 * who never filled theirs in counts as free.
 */
export function isAvailableAt(
  week: UsualWeek | null,
  instant: Date,
  timeZone: string,
): boolean {
  if (!week) return true;
  const { date, weekday, hour, clock } = wallOf(
    instant,
    week.timeZone ?? timeZone,
  );
  const today = week.exceptions.filter(
    (exception) => exception.date === date && covers(exception, clock),
  );
  if (today.some((exception) => !exception.available)) return false;
  if (today.some((exception) => exception.available)) return true;
  return !(week.weekly[weekday] ?? []).includes(hour);
}

/** Whether the half-hour from this moment is free: available and no appointment. */
export function isFreeSlot(
  week: UsualWeek | null,
  busy: readonly BusyTime[],
  instant: Date,
  timeZone: string,
): boolean {
  const start = instant.getTime();
  const end = start + FreeStep;
  if (
    busy.some(
      (block) =>
        block.startsAt.getTime() < end && block.endsAt.getTime() > start,
    )
  )
    return false;
  return isAvailableAt(week, instant, timeZone);
}

/**
 * Whether there's an unbroken free stretch of at least `minutes` between two
 * moments. Half-hours are counted from `from`, rounded up to the half-hour.
 */
export function hasFreeStretch(
  week: UsualWeek | null,
  busy: readonly BusyTime[],
  from: Date,
  to: Date,
  minutes: number,
  timeZone: string,
): boolean {
  const needed = Math.ceil((minutes * 60_000) / FreeStep);
  let run = 0;
  const first = Math.ceil(from.getTime() / FreeStep) * FreeStep;
  for (let at = first; at + FreeStep <= to.getTime(); at += FreeStep) {
    run = isFreeSlot(week, busy, new Date(at), timeZone) ? run + 1 : 0;
    if (run >= needed) return true;
  }
  return false;
}
