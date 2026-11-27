// File : /TeamSamsara.Workflow/app/src/features/workload/model/week.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : Someone's week as the screens show it: their usual week (their
// own, or the workspace's), the open tasks given to them that are due in it,
// and the word it reads as. The counting itself is the engine's
// (engine/src/workload.ts), shared with the server's hand-out.

import {
  taskSize,
  weekLoad,
  weekOf,
  weekState,
  type WeekState,
} from "@engine/workload";

/** As much of a task as someone's week reads. */
export interface TaskForWeek {
  memberId: string | null;
  dueAt: Date | null;
  doneAt: Date | null;
  checklist: readonly unknown[] | null;
  posts: readonly unknown[] | null;
  needsApproval: boolean;
}

export interface MemberWeek {
  start: Date;
  end: Date;
  usualWeek: number;
  /** How much of it their tasks take (bigger ones count twice). */
  load: number;
  /** How many tasks, and how many of them bigger ones. */
  tasks: number;
  bigger: number;
  state: WeekState;
}

export interface WeekSettings {
  timeZone: string;
  weekStartsOn: "monday" | "sunday";
}

/** Their usual week: their own, or the workspace's. */
export const usualWeekOf = (
  member: { usualWeek: number | null },
  workspace: { usualWeek: number },
): number => member.usualWeek ?? workspace.usualWeek;

/** Someone's week around a moment, from their open tasks. */
export function memberWeek(
  memberId: string,
  usualWeek: number,
  tasks: readonly TaskForWeek[],
  at: Date,
  settings: WeekSettings,
): MemberWeek {
  const week = weekOf(at, settings.timeZone, settings.weekStartsOn);
  const theirs = tasks.filter(
    (task) =>
      task.memberId === memberId &&
      !task.doneAt &&
      task.dueAt !== null &&
      task.dueAt >= week.start &&
      task.dueAt < week.end,
  );
  const load = weekLoad(theirs, week);
  return {
    ...week,
    usualWeek,
    load,
    tasks: theirs.length,
    bigger: theirs.filter((task) => taskSize(task) === "bigger").length,
    state: weekState(usualWeek, load),
  };
}

/** The weeks after this one, for "Coming weeks". */
export function comingWeeks(
  memberId: string,
  usualWeek: number,
  tasks: readonly TaskForWeek[],
  now: Date,
  settings: WeekSettings,
  count: number,
): MemberWeek[] {
  const weeks: MemberWeek[] = [];
  let at = now;
  for (let index = 0; index <= count; index += 1) {
    const week = memberWeek(memberId, usualWeek, tasks, at, settings);
    if (index > 0) weeks.push(week);
    // A moment in the middle of the next week, safe across clock changes.
    at = new Date(week.end.getTime() + 3 * 24 * 3600 * 1000);
  }
  return weeks;
}

/** "Nov 16 – 22" (or "Nov 30 – Dec 6") for a week, in the time zone. */
export function weekRange(
  week: { start: Date; end: Date },
  timeZone: string,
): string {
  const last = new Date(week.end.getTime() - 12 * 3600 * 1000);
  const month = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone, month: "short" }).format(date);
  const day = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(date);
  return month(week.start) === month(last)
    ? `${month(week.start)} ${day(week.start)} – ${day(last)}`
    : `${month(week.start)} ${day(week.start)} – ${month(last)} ${day(last)}`;
}
