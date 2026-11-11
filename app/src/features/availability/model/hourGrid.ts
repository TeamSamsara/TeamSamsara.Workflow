// File : /TeamSamsara.Workflow/app/src/features/availability/model/hourGrid.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Team availability by the hour, for the people shown: for each day
// and hour (8 AM to midnight in the zone shown), who's free and who's busy or
// unavailable. People who haven't filled in their availability are left out
// of the counts (not counted as busy) and listed apart. Also each person's
// free stretches per day for the People view, and the times of at least two
// hours when everyone shown is free.

import { fromWallTime, toWallTime } from "@/shared/time/zonedTime";
import type { WeekDay } from "@/shared/time/weekGrid";
import { checkPerson, stretches, type PersonTime } from "./freeBusy";

/** The hours each day shows: 8 AM up to midnight. */
export const FirstHour = 8;
export const HourCount = 16;

export interface GridPerson {
  id: string;
  time: PersonTime;
  /** Whether they've filled in their availability at all. */
  filled: boolean;
}

export interface HourCell {
  start: Date;
  end: Date;
  /** Filled-in people free the whole hour. */
  free: string[];
  /** Filled-in people busy or unavailable some of it. */
  busy: string[];
}

/** The moment an hour of a day starts, in the zone. */
export function hourStart(day: WeekDay, hour: number, timeZone: string): Date {
  const wall = toWallTime(day.start, timeZone);
  return fromWallTime({ ...wall, hour, minute: 0 }, timeZone);
}

/** Whether a person is free the whole hour. */
export function freeFor(
  person: PersonTime,
  start: Date,
  end: Date,
  timeZone: string,
): boolean {
  return checkPerson(person, start, end, timeZone).state === "free";
}

/** One cell: who's free and who isn't, among the filled-in people. */
export function hourCell(
  people: readonly GridPerson[],
  start: Date,
  end: Date,
  timeZone: string,
): HourCell {
  const cell: HourCell = { start, end, free: [], busy: [] };
  for (const person of people) {
    if (!person.filled) continue;
    (freeFor(person.time, start, end, timeZone) ? cell.free : cell.busy).push(
      person.id,
    );
  }
  return cell;
}

/** The week by the hour: rows of hours, a cell per day. */
export function hourRows(
  days: readonly WeekDay[],
  people: readonly GridPerson[],
  timeZone: string,
): HourCell[][] {
  return Array.from({ length: HourCount }, (_, row) =>
    days.map((day) => {
      const start = hourStart(day, FirstHour + row, timeZone);
      const end =
        FirstHour + row + 1 >= 24
          ? day.end
          : hourStart(day, FirstHour + row + 1, timeZone);
      return hourCell(people, start, end, timeZone);
    }),
  );
}

/** How full a cell is, for its shade: none, some, most, or everyone. */
export function cellTone(
  cell: HourCell,
): "empty" | "none" | "some" | "most" | "all" {
  const total = cell.free.length + cell.busy.length;
  if (total === 0) return "empty";
  if (cell.free.length === total) return "all";
  if (cell.free.length === 0) return "none";
  return cell.free.length / total >= 0.6 ? "most" : "some";
}

/** A person's free stretches in a day's shown hours, merged. */
export function freeStretches(
  person: PersonTime,
  day: WeekDay,
  timeZone: string,
): { start: Date; end: Date }[] {
  return stretches(
    person,
    hourStart(day, FirstHour, timeZone),
    day.end,
    timeZone,
  )
    .filter((stretch) => stretch.state === "free")
    .map(({ start, end }) => ({ start, end }));
}

/** The stretches of at least two hours when everyone shown and filled in is free. */
export function everyoneFree(
  rows: readonly HourCell[][],
  now: Date,
): { start: Date; end: Date }[] {
  const found: { start: Date; end: Date }[] = [];
  const dayCount = rows[0]?.length ?? 0;
  for (let day = 0; day < dayCount; day++) {
    let open: { start: Date; end: Date } | null = null;
    for (const row of rows) {
      const cell = row[day];
      const all =
        cell.busy.length === 0 &&
        cell.free.length > 0 &&
        cell.start.getTime() >= now.getTime();
      if (all) {
        open = open ? { start: open.start, end: cell.end } : { ...cell };
        continue;
      }
      if (open && open.end.getTime() - open.start.getTime() >= 2 * 3_600_000)
        found.push(open);
      open = null;
    }
    if (open && open.end.getTime() - open.start.getTime() >= 2 * 3_600_000)
      found.push({ start: open.start, end: open.end });
  }
  return found;
}
