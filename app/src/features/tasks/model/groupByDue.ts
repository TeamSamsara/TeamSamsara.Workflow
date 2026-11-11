// File : /TeamSamsara.Workflow/app/src/features/tasks/model/groupByDue.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Sorts tasks into Late, Today, Next 7 days, Later and No due date,
// by the calendar in the given time zone, earliest first in each. Focus shows
// the first three; Planning shows them all. Also where a week starts, for
// Done this week.

import { dayKey } from "@/shared/time/dates";
import { fromWallTime, toWallTime } from "@/shared/time/zonedTime";

export const DueGroups = ["late", "today", "next7", "later", "noDue"] as const;
export type DueGroup = (typeof DueGroups)[number];

/** The groups Focus shows: what's late, today's, and the next 7 days. */
export const FocusGroups: readonly DueGroup[] = ["late", "today", "next7"];

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function weekday(date: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return weekdayIndex[name] ?? 0;
}

/** Midnight at the start of the next week, in the time zone. */
export function startOfNextWeek(
  now: Date,
  timeZone: string,
  weekStartsOn: "monday" | "sunday",
): Date {
  const startIndex = weekStartsOn === "monday" ? 1 : 0;
  const daysLeft = (startIndex - weekday(now, timeZone) + 7) % 7 || 7;
  const wall = toWallTime(now, timeZone);
  return fromWallTime(
    { ...wall, day: wall.day + daysLeft, hour: 0, minute: 0 },
    timeZone,
  );
}

/** Midnight at the start of this week, in the time zone. */
export function startOfWeek(
  now: Date,
  timeZone: string,
  weekStartsOn: "monday" | "sunday",
): Date {
  const next = startOfNextWeek(now, timeZone, weekStartsOn);
  const wall = toWallTime(next, timeZone);
  return fromWallTime({ ...wall, day: wall.day - 7 }, timeZone);
}

/** Midnight at the start of the day `days` after today, in the time zone. */
function dayStart(now: Date, timeZone: string, days: number): Date {
  const wall = toWallTime(now, timeZone);
  return fromWallTime(
    { ...wall, day: wall.day + days, hour: 0, minute: 0 },
    timeZone,
  );
}

export function dueGroup(
  dueAt: Date | null,
  now: Date,
  timeZone: string,
): DueGroup {
  if (!dueAt) return "noDue";
  if (dueAt.getTime() < now.getTime()) return "late";
  if (dayKey(dueAt, timeZone) === dayKey(now, timeZone)) return "today";
  // Tomorrow through the 7th day from today.
  if (dueAt.getTime() < dayStart(now, timeZone, 8).getTime()) return "next7";
  return "later";
}

export function groupByDue<TTask extends { dueAt: Date | null }>(
  tasks: readonly TTask[],
  now: Date,
  timeZone: string,
): Record<DueGroup, TTask[]> {
  const groups: Record<DueGroup, TTask[]> = {
    late: [],
    today: [],
    next7: [],
    later: [],
    noDue: [],
  };
  const byDue = [...tasks].sort(
    (a, b) =>
      (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity),
  );
  for (const task of byDue) {
    groups[dueGroup(task.dueAt, now, timeZone)].push(task);
  }
  return groups;
}
