// File : /TeamSamsara.Workflow/app/src/features/tasks/model/groupByDue.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Sorts tasks into Late, Today, This week, Later and No due date,
// by the calendar in the workspace's time zone, earliest first in each.

import { dayKey } from "@/shared/time/dates";
import { fromWallTime, toWallTime } from "@/shared/time/zonedTime";

export const DueGroups = [
  "late",
  "today",
  "thisWeek",
  "later",
  "noDue",
] as const;
export type DueGroup = (typeof DueGroups)[number];

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

export function dueGroup(
  dueAt: Date | null,
  now: Date,
  timeZone: string,
  weekStartsOn: "monday" | "sunday",
): DueGroup {
  if (!dueAt) return "noDue";
  if (dueAt.getTime() < now.getTime()) return "late";
  if (dayKey(dueAt, timeZone) === dayKey(now, timeZone)) return "today";
  if (
    dueAt.getTime() < startOfNextWeek(now, timeZone, weekStartsOn).getTime()
  ) {
    return "thisWeek";
  }
  return "later";
}

export function groupByDue<TTask extends { dueAt: Date | null }>(
  tasks: readonly TTask[],
  now: Date,
  timeZone: string,
  weekStartsOn: "monday" | "sunday",
): Record<DueGroup, TTask[]> {
  const groups: Record<DueGroup, TTask[]> = {
    late: [],
    today: [],
    thisWeek: [],
    later: [],
    noDue: [],
  };
  const byDue = [...tasks].sort(
    (a, b) =>
      (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity),
  );
  for (const task of byDue) {
    groups[dueGroup(task.dueAt, now, timeZone, weekStartsOn)].push(task);
  }
  return groups;
}
